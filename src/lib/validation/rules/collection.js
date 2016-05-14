// contains:field,value
collectionRuleGenerator('contains',
  '{$alias} does not contain an item whose {$matchAlias} equals {$matchValue}.',
  function isInvalid(value, model, matchField, matchValue)
  {
    return !value.contains(function isMatch(m)
    {
      return m !== model && equalsCompare( matchValue, m.$get( matchField ) );
    });
  }
);

// not_contains:field,value
collectionRuleGenerator('not_contains',
  '{$alias} contains an item whose {$matchAlias} equals {$matchValue}.',
  function isInvalid(value, model, matchField, matchValue)
  {
    return value.contains(function isMatch(m)
    {
      return m !== model && equalsCompare( matchValue, m.$get( matchField ) );
    });
  }
);

function collectionRuleGenerator(ruleName, defaultMessage, isInvalid)
{
  Validation.Rules[ ruleName ] = function(field, params, database, getAlias, message)
  {
    if ( !params )
    {
      throw ruleName + ' validation rule requires field & value arguments';
    }

    var comma = params.indexOf(',');

    if ( comma === -1 )
    {
      throw ruleName + ' validation rule requires field & value arguments';
    }

    var matchField = params.substring( 0, comma );
    var matchValue = params.substring( comma + 1 );

    if ( indexOf( database.fields, matchField ) === -1 )
    {
      throw otherField + ' is not a valid field for the ' + ruleName + ' rule';
    }

    var messageTemplate = determineMessage( ruleName, message );
    var extra = {
      $matchField: matchField,
      $matchAlias: getAlias( matchField ),
      $matchValue: matchValue
    };

    return function(value, model, setMessage)
    {
      if ( isInvalid( value, model, matchField, matchValue ) )
      {
        setMessage( generateMessage( field, getAlias( field ), value, model, messageTemplate, extra ) );
      }

      return value;
    };
  };

  Validation.Rules[ ruleName ].message = defaultMessage;
}

Validation.Rules.validate = function(field, params, database, getAlias, message)
{
  // message, models, validations
  var messageOption = params || 'message';
  var messageTemplate = determineMessage( 'validate', message );

  return function(value, model, setMessage)
  {
    if ( isArray( value ) )
    {
      var invalid = new Collection();

      for (var i = 0; i < value.length; i++)
      {
        var model = value[ i ];

        if ( model && model.$validate && !model.$validate() )
        {
          invalid.push( model );
        }
      }

      if ( invalid.length )
      {
        switch (messageOption)
        {
          case 'models':
            setMessage( invalid );
            break;
          case 'validations':
            setMessage( invalid.pluck( '$validations', '$$key' ) );
            break;
          default: // message
            setMessage( generateMessage( field, getAlias( field ), value, model, messageTemplate ) );
            break;
        }
      }
    }

    return value;
  };
};

Validation.Rules.validate.message = '{$alias} is not valid.';