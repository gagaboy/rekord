function RemoveCache(model, cascade)
{
  this.reset( model, cascade );
}

Class.extend( Operation, RemoveCache,
{

  cascading: Cascade.None,

  interrupts: true,

  type: 'RemoveCache',

  run: function(db, model)
  {
    if ( db.cache === Cache.None )
    {
      this.finish();
    }
    else
    {
      db.store.remove( model.$key(), this.success(), this.failure() );
    }
  }

});
