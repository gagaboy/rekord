module( 'Rekord.Model remove cases' );

test( 'delete while in the middle of save', function(assert)
{
  var timer = assert.timer();
  var done = assert.async();

  var Todo = Rekord({
    name: 'delete_mid_save',
    fields: ['id', 'name']
  });

  var rest = Todo.Database.rest;

  var t0 = Todo.create({name: 'todo0'});

  ok( t0.$isSaved() );

  rest.delay = 1;

  t0.name = 'todo1';
  t0.$save();

  strictEqual( t0.$saved.name, 'todo0' );
  notOk( t0.$isDeleted() );

  rest.delay = 0;

  t0.$remove();

  wait(2, function()
  {
    strictEqual( rest.map.values.length, 0 );
    strictEqual( t0.$saved, void 0 )
    ok( t0.$isDeleted() );

    done();
  });

  timer.run();
});

test( 'delete with cache:none should go right to remote', function(assert)
{
  var Todo = Rekord({
    name: 'delete_cache_false',
    fields: ['id', 'name'],
    cache: Rekord.Cache.None
  });

  var rest = Todo.Database.rest;

  var t0 = Todo.create({name: 'todo#0'});

  rest.delay = 10;

  t0.$remove();

  strictEqual( t0.$operation.type, 'RemoveRemote' );
});

test( 'delete local when it hasn\'t been saved locally', function(assert)
{
  var Todo = Rekord({
    name: 'delete_local_missing',
    fields: ['id', 'name']
  });

  var local = Todo.Database.store;

  var t0 = new Todo({name: 'todo0'});

  notOk( t0.$isDeleted() );

  local.valid = false;
  t0.$save();
  local.valid = true;

  t0.$remove();

  ok( t0.$isDeleted() );
});

test( 'delete when it hasn\'t been saved remotely', function(assert)
{
  var Todo = Rekord({
    name: 'delete_not_remote',
    fields: ['id', 'name']
  });

  var local = Todo.Database.store.map;

  offline();

  var t0 = new Todo({name: 'todo0'});

  notOk( t0.$isSavedLocally() );
  notOk( t0.$isSaved() );

  t0.$save();

  ok( local.has( t0.id ) );
  ok( t0.$isSavedLocally() );
  notOk( t0.$isSaved() );

  t0.$remove();

  notOk( local.has( t0.id ) );
  notOk( t0.$isSaved() );

  online();

  noline();
});

test( 'delete while remotely removed (404/410)', function(assert)
{
  var Todo = Rekord({
    name: 'delete_remote_remove',
    fields: ['id', 'name']
  });

  var remote = Todo.Database.rest;

  var t0 = Todo.create({name: 'name0'});

  ok( t0.$isSaved() );

  remote.status = 404;

  t0.$remove();

  ok( t0.$isDeleted() );
});

test( 'delete with unexpected status code shouldn\'t remove from local storage', function(assert)
{
  var Todo = Rekord({
    name: 'delete_unexpected',
    fields: ['id', 'name']
  });

  var remote = Todo.Database.rest;
  var local = Todo.Database.store.map;

  var t0 = Todo.create({name: 'name0'});

  ok( t0.$isSaved() );
  ok( local.has( t0.id ) );
  ok( remote.map.has( t0.id ) );
  notOk( t0.$isDeleted() );

  remote.status = 303;

  t0.$remove();

  ok( local.has( t0.id ) );
  ok( remote.map.has( t0.id ) );
  ok( t0.$isDeleted() );

  remote.status = 200;

  t0.$remove();

  /* TODO fix remove that has failed - so I can remove locally. Remove $local
  notOk( local.has( t0.id ) );
  notOk( remote.map.has( t0.id ) );
  ok( t0.$isDeleted() );
   */
});

test( 'delete while offline, resume delete online', function(assert)
{
  var Todo = Rekord({
    name: 'delete_offline',
    fields: ['id', 'name']
  });

  var remote = Todo.Database.rest;
  var local = Todo.Database.store;

  var t0 = Todo.create({name: 'name0'});

  offline();

  ok( remote.map.has( t0.id ) );
  ok( local.map.has( t0.id ) );

  t0.$remove();

  ok( remote.map.has( t0.id ) );
  ok( local.map.has( t0.id ) );

  online();

  notOk( remote.map.has( t0.id ) );
  notOk( local.map.has( t0.id ) );

  noline();
});

test( 'remove remote transaction', function(assert)
{
  var timer = assert.timer();
  var prefix = 'RekordModel_remove_remote_transaction_';

  var Task = Rekord({
    name: prefix + 'task',
    fields: ['name', 'done', 'list_id']
  });

  var List = Rekord({
    name: prefix + 'list',
    fields: ['name'],
    hasMany: {
      tasks: {
        model: Task,
        foreign: 'list_id',
        cascadeRemove: Rekord.Cascade.All
      }
    }
  });

  var t0 = Task.create({name: 't0', done: 0});
  var t1 = Task.create({name: 't1', done: 1});
  var l0 = List.create({name: 'l0', tasks: [t0, t1]});

  l0.name = 'l0a';
  t0.name = 't0a';
  t1.$save();

  Task.Database.rest.delay = 2;
  List.Database.rest.delay = 1;

  var txn = l0.$remove();
  var done = false;

  txn.then(function(result)
  {
    ok( done, 'then called' );
    strictEqual( result, 'remote-success' );
  });

  wait( 0, function()
  {
    notOk( txn.isFinished() );
    strictEqual( txn.completed, 0 );
    strictEqual( txn.operations, 3 );
  });

  wait( 1, function()
  {
    notOk( txn.isFinished() );
    strictEqual( txn.completed, 1 );
    done = true;
  });

  wait( 2, function()
  {
    ok( txn.isFinished() );
    strictEqual( txn.completed, 3 );
  });

  timer.run();
});

test( 'remove local transaction', function(assert)
{
  var timer = assert.timer();
  var prefix = 'RekordModel_remove_local_transaction_';

  var Task = Rekord({
    name: prefix + 'task',
    fields: ['name', 'done', 'list_id']
  });

  var List = Rekord({
    name: prefix + 'list',
    fields: ['name'],
    hasMany: {
      tasks: {
        model: Task,
        foreign: 'list_id',
        cascadeRemove: Rekord.Cascade.Local
      }
    }
  });

  var t0 = Task.create({name: 't0', done: 0});
  var t1 = Task.create({name: 't1', done: 1});
  var l0 = List.create({name: 'l0', tasks: [t0, t1]});

  l0.name = 'l0a';
  t0.name = 't0a';
  t1.$save();

  Task.Database.store.delay = 2;
  List.Database.store.delay = 1;

  var txn = l0.$remove( Rekord.Cascade.Local );
  var done = false;

  txn.then(function(result)
  {
    ok( done, 'then called' );
    strictEqual( result, 'local-success' );
  });

  wait( 0, function()
  {
    notOk( txn.isFinished() );
    strictEqual( txn.completed, 0 );
    strictEqual( txn.operations, 3 );
  });

  wait( 1, function()
  {
    notOk( txn.isFinished() );
    strictEqual( txn.completed, 1 );
    done = true;
  });

  wait( 2, function()
  {
    ok( txn.isFinished() );
    strictEqual( txn.completed, 3 );
  });

  timer.run();
});

test( 'remove offline transaction', function(assert)
{
  var timer = assert.timer();
  var prefix = 'RekordModel_remove_offline_transaction_';

  var Task = Rekord({
    name: prefix + 'task',
    fields: ['name', 'done', 'list_id']
  });

  var List = Rekord({
    name: prefix + 'list',
    fields: ['name'],
    hasMany: {
      tasks: {
        model: Task,
        foreign: 'list_id'
      }
    }
  });

  var t0 = Task.create({name: 't0', done: 0});
  var t1 = Task.create({name: 't1', done: 1});
  var l0 = List.create({name: 'l0', tasks: [t0, t1]});

  l0.name = 'l0a';
  t0.name = 't0a';
  t1.$save();

  Task.Database.rest.delay = 2;
  List.Database.rest.delay = 1;

  offline();

  var txn = l0.$remove();

  txn.then(function(result)
  {
    strictEqual( result, 'offline' );
  });

  timer.run();

  noline();
});