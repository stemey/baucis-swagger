// This is a Controller mixin to add methods for generating Swagger data.

// __Dependencies__
var BaucisPropertyFilter = require('./BaucisPropertyFilter');
var JsonSchemaGenerator = require('mongoose-schema').JsonSchemaGenerator;

// __Private Members__


// __Module Definition__
var BaucisSchemaGenerator = module.exports = function (controller) {
    this.propertyFilter = new BaucisPropertyFilter(controller);
};

BaucisSchemaGenerator.prototype = new JsonSchemaGenerator();


