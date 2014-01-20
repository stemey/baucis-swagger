// This is a Controller mixin to add methods for generating Swagger data.

// __Dependencies__
var mongoose = require('mongoose');
var JsonSchemaGenerator = require('./BaucisSchemaGenerator');

// __Private Members__

// A method for capitalizing the first letter of a string
function capitalize(s) {
    if (!s) return s;
    if (s.length === 1) return s.toUpperCase();
    return s[0].toUpperCase() + s.substring(1);
}


// __Module Definition__
var decorator = module.exports = function () {
    var controller = this;

    // __Private Instance Members__


    // Generate parameter list for operations
    function generateParameters(verb, plural) {
        var parameters = [];

        // Parameters available for singular routes
        if (!plural) {
            parameters.push({
                paramType: 'path',
                name: 'id',
                description: 'The ID of a ' + controller.get('singular'),
                dataType: 'string',
                required: true,
                allowMultiple: false
            });

            parameters.push({
                paramType: 'header',
                name: 'X-Baucis-Update-Operator',
                description: '**BYPASSES VALIDATION** May be used with PUT to update the document using $push, $pull, or $set.',
                dataType: 'string',
                required: false,
                allowMultiple: false
            });
        }

        // Parameters available for plural routes
        if (plural) {
            parameters.push({
                paramType: 'query',
                name: 'skip',
                description: 'How many documents to skip.',
                dataType: 'int',
                required: false,
                allowMultiple: false
            });

            parameters.push({
                paramType: 'query',
                name: 'limit',
                description: 'The maximum number of documents to send.',
                dataType: 'int',
                required: false,
                allowMultiple: false
            });

            parameters.push({
                paramType: 'query',
                name: 'count',
                description: 'Set to true to return count instead of documents.',
                dataType: 'boolean',
                required: false,
                allowMultiple: false
            });

            parameters.push({
                paramType: 'query',
                name: 'conditions',
                description: 'Set the conditions used to find or remove the document(s).',
                dataType: 'string',
                required: false,
                allowMultiple: false
            });

            parameters.push({
                paramType: 'query',
                name: 'sort',
                description: 'Set the fields by which to sort.',
                dataType: 'string',
                required: false,
                allowMultiple: false
            });
        }

        // Parameters available for singular and plural routes
        parameters.push({
            paramType: 'query',
            name: 'select',
            description: 'Select which paths will be returned by the query.',
            dataType: 'string',
            required: false,
            allowMultiple: false
        });

        parameters.push({
            paramType: 'query',
            name: 'populate',
            description: 'Specify which paths to populate.',
            dataType: 'string',
            required: false,
            allowMultiple: false
        });

        if (verb === 'post') {
            // TODO post body can be single or array
            parameters.push({
                paramType: 'body',
                name: 'document',
                description: 'Create a document by sending the paths to be updated in the request body.',
                dataType: capitalize(controller.get('singular')),
                required: true,
                allowMultiple: false
            });
        }

        if (verb === 'put') {
            parameters.push({
                paramType: 'body',
                name: 'document',
                description: 'Update a document by sending the paths to be updated in the request body.',
                dataType: capitalize(controller.get('singular')),
                required: true,
                allowMultiple: false
            });
        }

        return parameters;
    };

    function generateErrorResponses(plural) {
        var errorResponses = [];

        // TODO other errors (400, 403, etc. )

        // Error rosponses for singular operations
        if (!plural) {
            errorResponses.push({
                code: 404,
                reason: 'No ' + controller.get('singular') + ' was found with that ID.'
            });
        }

        // Error rosponses for plural operations
        if (plural) {
            errorResponses.push({
                code: 404,
                reason: 'No ' + controller.get('plural') + ' matched that query.'
            });
        }

        // Error rosponses for both singular and plural operations
        // None.

        return errorResponses;
    };

    // Generate a list of a controller's operations
    function generateOperations(plural) {
        var operations = [];

        controller.activeVerbs().forEach(function (verb) {
            var operation = {};
            var titlePlural = capitalize(controller.get('plural'));
            var titleSingular = capitalize(controller.get('singular'));

            // Don't do head, post/put for single/plural
            if (verb === 'head') return;
            if (verb === 'post' && !plural) return;
            if (verb === 'put' && plural) return;

            // Use the full word
            if (verb === 'del') verb = 'delete';

            operation.httpMethod = verb.toUpperCase();

            if (plural) operation.nickname = verb + titlePlural;
            else operation.nickname = verb + titleSingular + 'ById';

            operation.responseClass = titleSingular; // TODO sometimes an array!

            if (plural) operation.summary = capitalize(verb) + ' some ' + controller.get('plural');
            else operation.summary = capitalize(verb) + ' a ' + controller.get('singular') + ' by its unique ID';

            operation.parameters = generateParameters(verb, plural);
            operation.errorResponses = generateErrorResponses(plural);

            operations.push(operation);
        });

        return operations;
    };

    // __Build the Definition__
    var modelName = capitalize(controller.get('singular'));

    controller.swagger = { apis: [], models: {} };

    // Model
    var jsonSchemaGenerator = new JsonSchemaGenerator(controller);
    var schema = controller.get('schema');
    var jsonSchema =jsonSchemaGenerator.generate(schema, controller);
    jsonSchema.id = capitalize(controller.get("singular"));
    controller.swagger.models[modelName] = jsonSchema;

        // Instance route
    controller.swagger.apis.push({
        path: '/' + controller.get('plural') + '/{id}',
        description: 'Operations about a given ' + controller.get('singular'),
        operations: generateOperations(false)
    });

    // Collection route
    controller.swagger.apis.push({
        path: '/' + controller.get('plural'),
        description: 'Operations about ' + controller.get('plural'),
        operations: generateOperations(true)
    });

    return controller;
};
