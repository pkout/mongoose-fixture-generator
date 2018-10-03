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
  let fixture = { id: faker.random.uuid() };

  Object.keys(model.schema.obj).forEach((key) => {
    const fakeVal = model.schema.obj[key].fake;

    if (_isFakerCode(fakeVal)) {
      const fakerCode = _extractFakerCode(fakeVal);
      fixture[key] = _createFake(fakerCode);
    } else {
      fixture[key] = fakeVal;
    }
  });

  return fixture;
}

function _forCountFixtures(count, modelCreatorFn) {
  return _.range(count).map(modelCreatorFn);
}

function _isFakerCode(str) {
  return str && str.startsWith('fake:');
}

function _extractFakerCode(str) {
  return str.substring(5);
}

function _createFake(fakerCode) {
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
