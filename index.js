const _ = require('lodash');
const faker = require('faker');
const mongoose = require('mongoose');

const fns = {}

fns.create = function(modelName, count, customData) {
  const data = _forCountFixtures(count, i => {
    return _createFixture(modelName)
  });

  _customizeFixtureData(data, customData);
  console.log('Fixtures generated');

  return count === 1 ? data[0] : data;
}

function _createFixture(modelName) {
  const model = mongoose.models[modelName];

  return _buildFixtureFromModel(model);
}

function _buildFixtureFromModel(model) {
  let fixture = { id: randomHex(24) };

  _buildFixtureForModelProps(model.schema, 'obj', fixture);

  return fixture;
}

function _buildFixtureForModelProps(schema, propPath, fixture) {
  Object.keys(_.get(schema, propPath)).forEach((name) => {
    const nestedPropPath = `${propPath}.${name}`;

    if (_isNestedSchemaProp(schema, nestedPropPath)) {
      return _buildFixtureForModelProps(schema, nestedPropPath, fixture);
    }
    const fakeVal = _.get(schema, nestedPropPath).fake;
    let fakedVal;

    if (_isFakerCode(fakeVal)) {
      const fakerCode = _extractFakerCode(fakeVal);
      fakedVal = _createFake(fakerCode);
    } else {
      fakedVal = fakeVal;
    }
    _.set(fixture, _convertToFixturePropPath(nestedPropPath), fakedVal);
  });
}

function _convertToFixturePropPath(propPath) {
  return propPath.substring(4);
}

function _isNestedSchemaProp(schema, propName) {
  return !Array.isArray(_.get(schema, propName))
    && _.get(schema, propName).fake === undefined
}

function _forCountFixtures(count, modelCreatorFn) {
  return _.range(count).map(modelCreatorFn);
}

function _isFakerCode(str) {
  return str && typeof str === 'string' && str.startsWith('fake:');
}

function _extractFakerCode(str) {
  return str.substring(5);
}

function _createFake(fakerCode) {
  if (fakerCode === 'random.mongoId') {
    return mongoose.Types.ObjectId();
  }

  return faker.fake('{{' + fakerCode + '}}')
}

function _customizeFixtureData(data, customData) {
    if (customData) {
      Object.keys(customData).forEach(key => {
        data.forEach(d => {
          _.set(d, key, customData[key]);
        });
      });
    }
  }

fns.createAndSave = function(modelName, count, customData) {
  const data = this.create(modelName, count, customData);

  return mongoose.models[modelName].insertMany(data)
    .then((docs) => {
      console.log('Fixtures saved');
      return count === 1 ? docs[0] : docs;
    })
}

fns.purge = function(modelName) {
  return mongoose.models[modelName].remove({})
    .then(() => {
      console.log('Fixtures purged');
      return;
    });
}

module.exports = fns;
