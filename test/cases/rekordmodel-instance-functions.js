module( 'Rekord.Model instance functions' );

test( 'constructor', function(assert)
{
  var Named = Rekord({
    name: 'Model_constructor',
    fields: ['id', 'name']
  });

  var n0 = new Named();
  isType( n0.id, 'string' );
  strictEqual( n0.name, void 0 );

  var n1 = new Named({name: 'name1'});
  isType( n1.id, 'string' );
  strictEqual( n1.name, 'name1' );

  var n2 = new Named({id: 5, name: 'name2'});
  strictEqual( n2.id, 5 );
  strictEqual( n2.name, 'name2' );
});

test( '$remote', function(assert)
{
  var Task = Rekord({
    name: 'Model_remote',
    fields: ['name', 'done'],
    decodings: {
      done: function(x) {
        return /(1|true|y|yes)/.test( (x + '').toLowerCase() );
      }
    }
  });

  var t0 = new Task.boot({name: 'Phil', done: '1'});

  strictEqual( t0.name, 'Phil' );
  strictEqual( t0.done, true );

  ok( t0.$isSaved() );
  notOk( t0.$hasChanges() );

  t0.$remote({
    done: 'no'
  });

  strictEqual( t0.done, false );

  ok( t0.$isSaved() );
  notOk( t0.$hasChanges() );
});

test( '$reset', function(assert)
{
  var Todo = Rekord({
    name: 'Model_reset',
    fields: ['id', 'name', 'done', 'times'],
    defaults: {
      name: '',
      done: false,
      times: 0
    }
  });

  var t0 = new Todo({name: 'Yo', done: true});
  t0.times += 23;

  strictEqual( t0.name, 'Yo' );
  strictEqual( t0.done, true );
  strictEqual( t0.times, 23 );

  t0.$reset();

  strictEqual( t0.name, '' );
  strictEqual( t0.done, false );
  strictEqual( t0.times, 0 );

  t0.done = true;

  t0.$reset({
    times: 10,
    name: 'Fo'
  });

  strictEqual( t0.name, 'Fo' );
  strictEqual( t0.done, false );
  strictEqual( t0.times, 10 );
});

test( '$set', function(assert)
{
  var Address = Rekord({
    name: 'Model_set_address',
    fields: ['id', 'street', 'city', 'state']
  });

  var Person = Rekord({
    name: 'Model_set_person',
    fields: ['id', 'first', 'last', 'address_id'],
    defaults: {
      address: Address.create
    },
    hasOne: {
      address: {
        model: Address,
        local: 'address_id'
      }
    }
  });

  var p0 = new Person();

  strictEqual( p0.first, void 0 );
  strictEqual( p0.last, void 0 );
  notStrictEqual( p0.address, void 0 );
  notStrictEqual( p0.address_id, void 0 );

  p0.$set('first', 'Jessica');

  strictEqual( p0.first, 'Jessica' );

  p0.$set({
    last: 'Jones'
  });

  strictEqual( p0.last, 'Jones' );

  var a0 = p0.address;

  p0.$set({
    address: Address.create({street: 'Easy St', city: 'NYC', state: 'NY'})
  });

  var a1 = p0.address;

  notStrictEqual( a0, a1 );
  ok( a0.$isDeleted() );
});

test( '$get', function(assert)
{
  var Address = Rekord({
    name: 'Model_get_address',
    fields: ['id', 'street', 'city', 'state']
  });

  var Person = Rekord({
    name: 'Model_get_person',
    fields: ['id', 'first', 'last', 'address_id'],
    defaults: {
      address: Address
    },
    hasOne: {
      address: {
        model: Address,
        local: 'address_id'
      }
    }
  });

  var p0 = Person.create({first: 'Jones', last: 'Jessica'});
  var a0 = p0.address;

  strictEqual( p0.$get( 'last' ), 'Jessica' );
  strictEqual( p0.$get( 'address' ), a0 );
  deepEqual( p0.$get( {first: 0} ), {first: 'Jones'} );
  deepEqual( p0.$get( ['last', 'first'] ), {last: 'Jessica', first: 'Jones'} );
});

test( '$relate $unrelate $isRelated $getRelation', function(assert)
{
  var Task = Rekord({
    name: 'Model_relations_task',
    fields: ['id', 'task_list_id', 'name', 'completed_at'],
    belongsTo: {
      list: {
        model: 'Model_relations_tasklist',
        local: 'task_list_id',
        clearKey: false
      }
    }
  });

  var TaskList = Rekord({
    name: 'Model_relations_tasklist',
    fields: ['id', 'name'],
    hasMany: {
      tasks: {
        model: 'Model_relations_task',
        foreign: 'task_list_id',
        clearKey: false
      }
    }
  });

  var l0 = TaskList.create({name: 'TaskList0'});

  strictEqual( l0.tasks.length, 0 );

  var t0 = Task.create({name: 'Task0'});

  l0.$relate( 'tasks', t0 );

  strictEqual( l0.tasks.length, 1 );
  strictEqual( l0.id, t0.task_list_id );
  strictEqual( l0.id, t0.list.id );

  ok( l0.$isRelated( 'tasks', t0 ) );
  ok( l0.$isRelated( 'tasks', t0.id ) );

  l0.$unrelate( 'tasks', t0.id );

  strictEqual( l0.tasks.length, 0 );
  strictEqual( t0.task_list_id, l0.id, 'foreign key not cleared, does not matter when you are removed' );

  notStrictEqual( l0.$getRelation( 'tasks' ), void 0 );
});

test( '$save', function(assert)
{
  var Issue = Rekord({
    name: 'Model_save',
    fields: ['id', 'title', 'number']
  });

  var i0 = new Issue();

  i0.$save({
    title: 'Title0',
    number: 1
  });

  ok( i0.$isSaved() );

  strictEqual( i0.title, 'Title0' );
  strictEqual( i0.number, 1 );

  i0.$save('number', 4);

  strictEqual( i0.title, 'Title0' );
  strictEqual( i0.number, 4 );

  i0.title = 'Title1';
  i0.$save();

  strictEqual( i0.title, 'Title1' );
  strictEqual( i0.number, 4 );
});

/*
test( '$save cascade remote', function(assert)
{
  var Issue = Rekord({
    name: 'Model_save_cascade_remote',
    fields: ['id', 'title', 'number']
  });

  var local = Issue.Database.store;
  var remote = Issue.Database.rest;
  var live = Issue.Database.live;

  var i0 = new Issue();

  strictEqual( local.lastRecord, null );
  strictEqual( remote.lastRecord, null );
  strictEqual( live.lastMessage, null );

  i0.$save( { title: 'Title0', number: 1 }, Rekord.Cascade.Remote );

  strictEqual( local.lastRecord, void 0 );
  notStrictEqual( remote.lastRecord, null );
  notStrictEqual( live.lastMessage, null );
});

test( '$save cascade rest', function(assert)
{
  var Issue = Rekord({
    name: 'Model_save_cascade_rest',
    fields: ['id', 'title', 'number']
  });

  var local = Issue.Database.store;
  var remote = Issue.Database.rest;
  var live = Issue.Database.live;

  var i0 = new Issue();

  strictEqual( local.lastRecord, null );
  strictEqual( remote.lastRecord, null );
  strictEqual( live.lastMessage, null );

  i0.$save( { title: 'Title0', number: 1 }, Rekord.Cascade.Rest );

  strictEqual( local.lastRecord, void 0 );
  notStrictEqual( remote.lastRecord, null );
  strictEqual( live.lastMessage, null );
});

test( '$save cascade local', function(assert)
{
  var Issue = Rekord({
    name: 'Model_save_cascade_local',
    fields: ['id', 'title', 'number']
  });

  var local = Issue.Database.store;
  var remote = Issue.Database.rest;
  var live = Issue.Database.live;

  var i0 = new Issue();

  strictEqual( local.lastRecord, null );
  strictEqual( remote.lastRecord, null );
  strictEqual( live.lastMessage, null );

  i0.$save( { title: 'Title0', number: 1 }, Rekord.Cascade.Local );

  notStrictEqual( local.lastRecord, null );
  strictEqual( remote.lastRecord, null );
  strictEqual( live.lastMessage, null );
});

test( '$save cascade none', function(assert)
{
  var Issue = Rekord({
    name: 'Model_save_cascade_none',
    fields: ['id', 'title', 'number']
  });

  var local = Issue.Database.store;
  var remote = Issue.Database.rest;
  var live = Issue.Database.live;

  var i0 = new Issue();

  strictEqual( local.lastRecord, null );
  strictEqual( remote.lastRecord, null );
  strictEqual( live.lastMessage, null );

  i0.$save( { title: 'Title0', number: 1 }, Rekord.Cascade.None );

  strictEqual( local.lastRecord, null );
  strictEqual( remote.lastRecord, null );
  strictEqual( live.lastMessage, null );
});

test( '$remove cascade none', function(assert)
{
  var Issue = Rekord({
    name: 'Model_remove_cascade_none',
    fields: ['id', 'title', 'number']
  });

  var local = Issue.Database.store;
  var remote = Issue.Database.rest;
  var live = Issue.Database.live;

  var i0 = Issue.create({title: 'Title0', number: 1});

  ok( local.map.has( i0.id ) );
  ok( remote.map.has( i0.id ) );
  strictEqual( live.lastMessage.op, 'SAVE' );

  i0.$remove( Rekord.Cascade.None );

  ok( local.map.has( i0.id ) );
  ok( remote.map.has( i0.id ) );
  strictEqual( live.lastMessage.op, 'SAVE' );
});

test( '$remove cascade rest', function(assert)
{
  var Issue = Rekord({
    name: 'Model_remove_cascade_rest',
    fields: ['id', 'title', 'number']
  });

  var local = Issue.Database.store;
  var remote = Issue.Database.rest;
  var live = Issue.Database.live;

  var i0 = Issue.create({title: 'Title0', number: 1});

  ok( local.map.has( i0.id ) );
  ok( remote.map.has( i0.id ) );
  strictEqual( live.lastMessage.op, 'SAVE' );

  i0.$remove( Rekord.Cascade.Rest );

  notOk( local.map.has( i0.id ) );
  notOk( remote.map.has( i0.id ) );
  strictEqual( live.lastMessage.op, 'SAVE' );
});

test( '$remove cascade remote', function(assert)
{
  var Issue = Rekord({
    name: 'Model_remove_cascade_remote',
    fields: ['id', 'title', 'number']
  });

  var local = Issue.Database.store;
  var remote = Issue.Database.rest;
  var live = Issue.Database.live;

  var i0 = Issue.create({title: 'Title0', number: 1});

  ok( local.map.has( i0.id ) );
  ok( remote.map.has( i0.id ) );
  strictEqual( live.lastMessage.op, 'SAVE' );

  i0.$remove( Rekord.Cascade.Remote );

  notOk( local.map.has( i0.id ) );
  notOk( remote.map.has( i0.id ) );
  strictEqual( live.lastMessage.op, 'REMOVE' );
});
*/

test( '$remove $exists', function(assert)
{
  var Issue = Rekord({
    name: 'Model_remove_exists',
    fields: ['id', 'title', 'number']
  });

  var i0 = new Issue({title: 'Tissue'});

  notOk( i0.$exists() );

  i0.$save();

  ok( i0.$exists() );

  i0.$remove();

  notOk( i0.$exists() );
});

test( '$key', function(assert)
{
  var Issue = Rekord({
    name: 'Model_key',
    fields: ['id', 'title', 'number']
  });

  var i0 = new Issue({title: 'Wipe'});

  isType( i0.id, 'string' );
  notStrictEqual( i0.$key(), void 0 );
  notStrictEqual( i0.id, void 0 );
  strictEqual( i0.$keys(), i0.id );
});

test( '$keys', function(assert)
{
  var Issue = Rekord({
    name: 'Model_keys',
    key: ['id', 'number'],
    fields: ['id', 'title', 'number']
  });

  var i0 = new Issue({id: 4, number: 3, title: 'Wipe'});

  strictEqual( i0.$key(), '4/3' );
  deepEqual( i0.$keys(), [4,3] );
});

test( '$isSaved', function(assert)
{
  var Issue = Rekord({
    name: 'Model_isSaved',
    fields: ['id', 'title', 'number']
  });

  var i0 = new Issue({title: 'Not!'});

  notOk( i0.$isSaved() );

  i0.$save();

  ok( i0.$isSaved() );
});

test( '$isSavedLocally', function(assert)
{
  var timer = assert.timer();

  var Issue = Rekord({
    name: 'Model_isSavedLocally',
    fields: ['id', 'title', 'number']
  });

  var rest = Rekord.rest.Model_isSavedLocally;

  var i0 = new Issue({title: 'issue#0'});

  expect(6);

  notOk( i0.$isSavedLocally() );
  notOk( i0.$isSaved() );

  rest.delay = 1;

  i0.$save();

  ok( i0.$isSavedLocally() );
  notOk( i0.$isSaved() );

  wait(2, function()
  {
    ok( i0.$isSavedLocally() );
    ok( i0.$isSaved() );
  });

  timer.run();
});

test( '$getChanges', function(assert)
{
  var Todo = Rekord({
    name: 'Model_getChanges',
    fields: ['id', 'name']
  });

  var t0 = new Todo({name: 'this'});

  deepEqual( t0.$getChanges(), {id: t0.id, name: 'this'} );

  t0.$save();

  deepEqual( t0.$getChanges(), {} );

  t0.name = 'changed!';

  deepEqual( t0.$getChanges(), {name: 'changed!'} );

  t0.$save();

  deepEqual( t0.$getChanges(), {} );
});

test( '$hasChanges', function(assert)
{
  var Todo = Rekord({
    name: 'Model_hasChanges',
    fields: ['id', 'name']
  });

  var t0 = new Todo({name: 'this'});

  ok( t0.$hasChanges() );

  t0.$save();

  notOk( t0.$hasChanges() );

  t0.name = 'changed!';

  ok( t0.$hasChanges() );

  t0.$save();

  notOk( t0.$hasChanges() );
});

test( '$hasChange', function(assert)
{
  var Todo = Rekord({
    name: 'Model_hasChange',
    fields: ['id', 'name']
  });

  var t0 = new Todo({name: 'this'});

  ok( t0.$hasChange('name') );

  t0.$save();

  notOk( t0.$hasChange('name') );

  t0.name = 'changed!';

  ok( t0.$hasChange('name') );

  t0.$save();

  notOk( t0.$hasChange('name') );
});

test( '$hasChanges ignored fields', function(assert)
{
  var prefix = 'Model_hasChanges_ignored_';

  var Todo = Rekord({
    name: 'Model_hasChanges_ignored_',
    fields: ['name', 'done'],
    ignoredFields: {
      done: true
    }
  });

  var t0 = Todo.create({name: 't0'});

  notOk( t0.$hasChanges() );

  t0.done = false;

  var prev = t0.$saved.done;

  t0.$save();

  strictEqual( t0.$saved.done, prev );

  notOk( t0.$hasChanges() );

  t0.name = 't0a';

  ok( t0.$hasChanges() );
});

test( '$refresh', function(assert)
{
  var Todo = Rekord({
    name: 'Model_refresh',
    fields: ['name']
  });

  var remote = Todo.Database.rest;

  var t0 = Todo.create({name: 'name0'});

  strictEqual( t0.name, 'name0' );

  remote.map.put( t0.id, {id: t0.id, name: 'name1'} );

  t0.$refresh();

  strictEqual( t0.name, 'name1' );
});

test( '$autoRefresh', function(assert)
{
  noline();

  var Todo = Rekord({
    name: 'Model_autoRefresh',
    fields: ['name']
  });

  var remote = Todo.Database.rest;

  var t0 = Todo.create({name: 'name0'});

  t0.$autoRefresh();

  strictEqual( t0.name, 'name0' );

  remote.map.put( t0.id, {id: t0.id, name: 'name1'} );

  offline();

  strictEqual( t0.name, 'name0' );

  online();

  strictEqual( t0.name, 'name1' );

  noline();
});

test( '$cancel', function(assert)
{
  var prefix = 'Model_cancel_';

  var Task = Rekord({
    name: prefix + 'task',
    fields: ['name', 'done']
  });

  var t0 = Task.create({name: 't0', done: true});

  strictEqual( t0.name, 't0' );
  strictEqual( t0.done, true );

  t0.name = 't0a';
  t0.done = false;

  strictEqual( t0.name, 't0a' );
  strictEqual( t0.done, false );

  t0.$cancel();

  strictEqual( t0.name, 't0' );
  strictEqual( t0.done, true );
});

test( '$push $pop $discard', function(assert)
{
  var prefix = 'Model_push_';

  var Task = Rekord({
    name: prefix + 'task',
    fields: ['list_id', 'name', 'done']
  });

  var TaskList = Rekord({
    name: prefix + 'list',
    fields: ['name'],
    hasMany: {
      tasks: {
        model: Task,
        foreign: 'list_id',
        comparator: 'name',
        cascadeRemove: false
      }
    }
  });

  var t0 = Task.create({name: 't0', done: true});
  var t1 = Task.create({name: 't1', done: false});
  var t2 = Task.create({name: 't2', done: true});
  var l0 = TaskList.create({name: 'l0', tasks: [t0, t1, t2]});

  deepEqual( l0.tasks.toArray(), [t0, t1, t2], 'tasks initialized correctly' );

  l0.$push();

  l0.name = 'l0a';
  l0.tasks.unrelate( t0 );

  deepEqual( l0.tasks.toArray(), [t1, t2], 'task 0 unrelated' );

  l0.$pop();

  strictEqual( l0.name, 'l0' );
  deepEqual( l0.tasks.toArray(), [t1, t2], 'tasks untouched' );

  l0.$push(['tasks']);

  l0.tasks.unrelate( t1 );

  deepEqual( l0.tasks.toArray(), [t2], 'task 1 unrelated' );

  l0.$pop();

  deepEqual( l0.tasks.toArray(), [t1, t2], 'task 1 restored from pop' );

  l0.$push(['tasks']);
  l0.tasks.unrelate();

  deepEqual( l0.tasks.toArray(), [], 'tasks removed' );

  l0.$discard();
  l0.$pop();

  deepEqual( l0.tasks.toArray(), [], 'tasks removed' );
});

test( '$change', function(assert)
{
  var prefix = 'Model_change_';

  var Task = Rekord({
    name: prefix + 'task',
    fields: ['name', 'done']
  });

  var t0 = new Task({name: 't0'});

  expect(1);

  t0.$change(function()
  {
    notOk();
  });

  t0.$save();
});

test( '$clone simple', function(assert)
{
  var prefix = 'Model_clone_simple_';

  var Task = Rekord({
    name: prefix + 'task',
    fields: ['name', 'done', 'finished_at']
  });

  var t0 = new Task({name: 't0', done: true, finished_at: currentTime()()});

  ok( t0.$key() );
  strictEqual( t0.name, 't0' );
  strictEqual( t0.done, true );
  isType( t0.finished_at, 'number' );

  var t1 = t0.$clone();

  ok( t1.$key() );
  notStrictEqual( t1.id, t0.id );
  strictEqual( t1.name, 't0' );
  strictEqual( t1.done, true );
  isType( t1.finished_at, 'number' );

  notStrictEqual( t0, t1 );
});

test( '$clone overwrite', function(assert)
{
  var prefix = 'Model_clone_overwrite_';

  var Task = Rekord({
    name: prefix + 'task',
    fields: ['name', 'done', 'finished_at']
  });

  var t0 = new Task({name: 't0', done: true, finished_at: currentTime()()});

  ok( t0.$key() );
  strictEqual( t0.name, 't0' );
  strictEqual( t0.done, true );
  isType( t0.finished_at, 'number' );

  var t1 = t0.$clone({name: 't0a', done: false, finished_at: currentTime()});

  ok( t1.$key() );
  notStrictEqual( t1.id, t0.id );
  strictEqual( t1.name, 't0a' );
  strictEqual( t1.done, false );
  isType( t1.finished_at, 'number' );

  notStrictEqual( t0, t1 );
});

test( '$load all', function(assert)
{
  var prefix = 'Model_load_all_';

  var Task = Rekord({
    name: prefix + 'task',
    fields: ['list_id', 'name', 'done']
  });

  var User = Rekord({
    name: prefix + 'user',
    fields: ['name']
  });

  var TaskList = Rekord({
    name: prefix + 'list',
    fields: ['name', 'created_by'],
    hasMany: {
      tasks: {
        model: Task,
        foreign: 'list_id',
        lazy: true,
        query: '/tasks/{id}'
      }
    },
    belongsTo: {
      creator: {
        model: User,
        local: 'created_by',
        lazy: true
      }
    }
  });

  Task.Database.rest.queries.put( '/tasks/1', [
    {id: 3, name: 't3', done: true},
    {id: 4, name: 't4', done: false}
  ]);

  User.boot( {id: 4, name: 'u4'} );

  var l0 = TaskList.boot( {id: 1, name: 'l1', created_by: 4} );

  strictEqual( l0.tasks, void 0 );
  strictEqual( l0.creator, void 0 );

  l0.$load();

  notStrictEqual( l0.tasks, void 0 );
  notStrictEqual( l0.creator, void 0 );

  strictEqual( l0.tasks.length, 2 );
  strictEqual( l0.tasks[0].name, 't3' );
  strictEqual( l0.tasks[1].name, 't4' );
  strictEqual( l0.creator.name, 'u4' );
});

test( '$load single', function(assert)
{
  var prefix = 'Model_load_single_';

  var Task = Rekord({
    name: prefix + 'task',
    fields: ['list_id', 'name', 'done']
  });

  var User = Rekord({
    name: prefix + 'user',
    fields: ['name']
  });

  var TaskList = Rekord({
    name: prefix + 'list',
    fields: ['name', 'created_by'],
    hasMany: {
      tasks: {
        model: Task,
        foreign: 'list_id',
        lazy: true,
        query: '/tasks/{id}'
      }
    },
    belongsTo: {
      creator: {
        model: User,
        local: 'created_by',
        lazy: true
      }
    }
  });

  Task.Database.rest.queries.put( '/tasks/1', [
    {id: 3, name: 't3', done: true},
    {id: 4, name: 't4', done: false}
  ]);

  User.boot( {id: 4, name: 'u4'} );

  var l0 = TaskList.boot( {id: 1, name: 'l1', created_by: 4} );

  strictEqual( l0.tasks, void 0 );
  strictEqual( l0.creator, void 0 );

  l0.$load('tasks');

  notStrictEqual( l0.tasks, void 0 );
  strictEqual( l0.creator, void 0 );

  strictEqual( l0.tasks.length, 2 );
  strictEqual( l0.tasks[0].name, 't3' );
  strictEqual( l0.tasks[1].name, 't4' );
});

test( '$load array', function(assert)
{
  var prefix = 'Model_load_array_';

  var Task = Rekord({
    name: prefix + 'task',
    fields: ['list_id', 'name', 'done']
  });

  var User = Rekord({
    name: prefix + 'user',
    fields: ['name']
  });

  var TaskList = Rekord({
    name: prefix + 'list',
    fields: ['name', 'created_by'],
    hasMany: {
      tasks: {
        model: Task,
        foreign: 'list_id',
        lazy: true,
        query: '/tasks/{id}'
      }
    },
    belongsTo: {
      creator: {
        model: User,
        local: 'created_by',
        lazy: true
      }
    }
  });

  Task.Database.rest.queries.put( '/tasks/1', [
    {id: 3, name: 't3', done: true},
    {id: 4, name: 't4', done: false}
  ]);

  User.boot( {id: 4, name: 'u4'} );

  var l0 = TaskList.boot( {id: 1, name: 'l1', created_by: 4} );

  strictEqual( l0.tasks, void 0 );
  strictEqual( l0.creator, void 0 );

  l0.$load(['tasks', 'creator']);

  notStrictEqual( l0.tasks, void 0 );
  notStrictEqual( l0.creator, void 0 );

  strictEqual( l0.tasks.length, 2 );
  strictEqual( l0.tasks[0].name, 't3' );
  strictEqual( l0.tasks[1].name, 't4' );
  strictEqual( l0.creator.name, 'u4' );
});

test( '$decode', function(assert)
{
  var prefix = 'Model_decode_';

  var Task = Rekord({
    name: prefix + 'task',
    fields: ['name', 'done'],
    decodings: {
      done: function(x) {
        return !!x;
      }
    }
  });

  var t0 = Task.boot({name: 't0', done: 1});

  strictEqual( t0.done, true );

  t0.done = 0;
  t0.$decode();

  strictEqual( t0.done, false );
});

test( 'cascade chain', function(assert)
{
  var prefix = 'Model_cascade_chain_';

  var User = Rekord({
    name: prefix + 'user',
    fields: ['name']
  });

  var Task = Rekord({
    name: prefix + 'task',
    fields: ['list_id', 'name', 'done', 'created_by'],
    hasOne: {
      creator: {
        model: User,
        local: 'created_by',
        cascade: Rekord.Cascade.All
      }
    }
  });

  var List = Rekord({
    name: prefix + 'list',
    fields: ['name'],
    hasMany: {
      tasks: {
        model: Task,
        foreign: 'list_id',
        cascadeSave: Rekord.Cascade.All
      }
    }
  });

  var u0 = User.create({name: 'u0'});
  var t0 = Task.create({name: 't0', done: 1, creator: u0});
  var t1 = Task.create({name: 't1', done: 0, creator: u0});
  var l0 = List.create({name: 'l0', tasks: [t0, t1]});

  notOk( u0.$hasChanges() );
  notOk( t0.$hasChanges() );
  notOk( t1.$hasChanges() );
  notOk( l0.$hasChanges() );

  u0.name = 'u0a';
  t0.name = 't0a';
  t1.name = 't1a';
  l0.name = 'l0a';

  ok( u0.$hasChanges() );
  ok( t0.$hasChanges() );
  ok( t1.$hasChanges() );
  ok( l0.$hasChanges() );

  l0.$save();

  notOk( u0.$hasChanges() );
  notOk( t0.$hasChanges() );
  notOk( t1.$hasChanges() );
  notOk( l0.$hasChanges() );
});

test( 'event partial update', function(assert)
{
  var prefix = 'Model_event_partial_update_';

  var Task = Rekord({
    name: prefix + '_task',
    fields: ['name', 'done']
  });

  expect(4);

  var t2 = Task.create({id: 2, name: 't2', done: false});

  t2.$on( Rekord.Model.Events.FullUpdate, function(encoded, updated, previous, saved, conflicts) {
    ok( false, 'this shoud not be triggered' );
  });

  t2.$on( Rekord.Model.Events.PartialUpdate, function(encoded, updated, previous, saved, conflicts) {
    deepEqual( updated, {done: true}, 'done updated' );
    deepEqual( previous, {done: false, name: 'local change'}, 'previous correct' );
    deepEqual( saved, {done: false, name: 't2'}, 'saved correct' );
    deepEqual( conflicts, {name: 'remote change'}, 'conflicts correct' );
  });

  t2.name = 'local change';

  Task.Database.putRemoteData( {name: 'remote change', done: true}, 2 );
});

test( 'event full update', function(assert)
{
  var prefix = 'Model_event_full_update_';

  var Task = Rekord({
    name: prefix + '_task',
    fields: ['name', 'done']
  });

  expect(4);

  var t2 = Task.create({id: 2, name: 't2', done: false});

  t2.$on( Rekord.Model.Events.FullUpdate, function(encoded, updated, previous, saved, conflicts) {
    deepEqual( updated, {done: true, name: 'remote change'}, 'done updated' );
    deepEqual( previous, {done: false, name: 't2'}, 'previous correct' );
    deepEqual( saved, {done: false, name: 't2'}, 'saved correct' );
    deepEqual( conflicts, {}, 'conflicts correct' );
  });

  t2.$on( Rekord.Model.Events.PartialUpdate, function(encoded, updated, previous, saved, conflicts) {
    ok( false, 'this shoud not be triggered' );
  });

  Task.Database.putRemoteData( {name: 'remote change', done: true}, 2 );
});

test( 'event remote update', function(assert)
{
  var prefix = 'Model_event_remote_update_';

  var Task = Rekord({
    name: prefix + '_task',
    fields: ['name', 'done']
  });

  expect(5);

  var t2 = Task.create({id: 2, name: 't2', done: false});

  t2.$on( Rekord.Model.Events.RemoteUpdate, function(encoded, updated, previous, saved, conflicts) {
    deepEqual( updated, {done: true, name: 'remote change'}, 'done updated' );
    deepEqual( previous, {done: false, name: 't2'}, 'previous correct' );
    deepEqual( saved, {done: false, name: 't2'}, 'saved correct' );
    deepEqual( conflicts, {}, 'conflicts correct' );
  });

  t2.$on( Rekord.Model.Events.FullUpdate, function(encoded, updated, previous, saved, conflicts) {
    ok( true, 'this shoud be triggered' );
  });

  t2.$on( Rekord.Model.Events.PartialUpdate, function(encoded, updated, previous, saved, conflicts) {
    ok( false, 'this shoud not be triggered' );
  });

  Task.Database.putRemoteData( {name: 'remote change', done: true}, 2 );
});

test( '$save missing key', function(assert)
{
  var prefix = 'Model_save_missing_key_';

  var Task = Rekord({
    name: prefix + 'task',
    fields: ['name', 'done']
  });

  var t0 = Task.create({name: 't0', done: false});

  ok( t0.id );

  t0.id = null;

  throws(function()
  {
    t0.$save();

  }, 'Key missing from model' );
});

test( 'load missing key', function(assert)
{
  var prefix = 'Model_load_missing_key_';
  var ListItemName = prefix + 'list_item';

  var ListItemRest = Rekord.rest[ ListItemName ] = new TestRest();

  ListItemRest.map.put('2/3', {item_id: 2, list_id: 3, amount: 4});
  ListItemRest.map.put('5/6', {list_id: 6, amount: 7});
  ListItemRest.map.put('8/9', {amount: 10});

  var ListItem = Rekord({
    name: ListItemName,
    key: ['item_id', 'list_id'],
    fields: ['amount']
  });

  strictEqual( ListItem.all().length, 1 );
  strictEqual( ListItem.all()[0].amount, 4 );
});

test( 'live missing key', function(assert)
{
  var prefix = 'Model_live_missing_key_';
  var ListItemName = prefix + 'list_item';

  var ListItem = Rekord({
    name: ListItemName,
    key: ['item_id', 'list_id'],
    fields: ['amount']
  });

  strictEqual( ListItem.all().length, 0 );

  ListItem.Database.putRemoteData( {list_id: 6, amount: 7}, '5/6' );

  strictEqual( ListItem.all().length, 0 );
});

test( 'boot missing key', function(assert)
{
  var prefix = 'Model_live_missing_key_';
  var ListItemName = prefix + 'list_item';

  var ListItem = Rekord({
    name: ListItemName,
    key: ['item_id', 'list_id'],
    fields: ['amount']
  });

  notOk( ListItem.boot( {list_id: 6, amount: 7} ) );
});
