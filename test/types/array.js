'use strict';

// Load modules

const Lab = require('lab');
const Joi = require('../..');
const Helper = require('../helper');


// Declare internals

const internals = {};


// Test shortcuts

const lab = exports.lab = Lab.script();
const describe = lab.describe;
const it = lab.it;
const expect = Lab.expect;


describe('array', () => {

    it('should throw an exception if arguments were passed.', (done) => {

        expect(
            () => Joi.array('invalid argument.')
        ).to.throw('Joi.array() does not allow arguments.');

        done();
    });

    it('converts a string to an array', (done) => {

        Joi.array().validate('[1,2,3]', (err, value) => {

            expect(err).to.not.exist();
            expect(value.length).to.equal(3);
            done();
        });
    });

    it('errors on non-array string', (done) => {

        Joi.array().validate('{ "something": false }', (err, value) => {

            expect(err).to.be.an.error('"value" must be an array');
            expect(err.details).to.equal([{
                message: '"value" must be an array',
                path: [],
                type: 'array.base',
                context: { label: 'value', key: undefined }
            }]);
            done();
        });
    });

    it('errors on number', (done) => {

        Joi.array().validate(3, (err, value) => {

            expect(err).to.be.an.error('"value" must be an array');
            expect(err.details).to.equal([{
                message: '"value" must be an array',
                path: [],
                type: 'array.base',
                context: { label: 'value', key: undefined }
            }]);
            expect(value).to.equal(3);
            done();
        });
    });

    it('converts a non-array string with number type', (done) => {

        Joi.array().validate('3', (err, value) => {

            expect(err).to.be.an.error('"value" must be an array');
            expect(err.details).to.equal([{
                message: '"value" must be an array',
                path: [],
                type: 'array.base',
                context: { label: 'value', key: undefined }
            }]);
            expect(value).to.equal('3');
            done();
        });
    });

    it('errors on a non-array string', (done) => {

        Joi.array().validate('asdf', (err, value) => {

            expect(err).to.be.an.error('"value" must be an array');
            expect(err.details).to.equal([{
                message: '"value" must be an array',
                path: [],
                type: 'array.base',
                context: { label: 'value', key: undefined }
            }]);
            expect(value).to.equal('asdf');
            done();
        });
    });

    describe('items()', () => {

        it('converts members', (done) => {

            const schema = Joi.array().items(Joi.number());
            const input = ['1', '2', '3'];
            schema.validate(input, (err, value) => {

                expect(err).to.not.exist();
                expect(value).to.equal([1, 2, 3]);
                done();
            });
        });

        it('shows path to errors in array items', (done) => {

            expect(() => {

                Joi.array().items({
                    a: {
                        b: {
                            c: {
                                d: undefined
                            }
                        }
                    }
                });
            }).to.throw(Error, 'Invalid schema content: (0.a.b.c.d)');

            expect(() => {

                Joi.array().items({ foo: 'bar' }, undefined);
            }).to.throw(Error, 'Invalid schema content: (1)');

            done();
        });

        it('allows zero size', (done) => {

            const schema = Joi.object({
                test: Joi.array().items(Joi.object({
                    foo: Joi.string().required()
                }))
            });
            const input = { test: [] };

            schema.validate(input, (err, value) => {

                expect(err).to.not.exist();
                done();
            });
        });

        it('returns the first error when only one inclusion', (done) => {

            const schema = Joi.object({
                test: Joi.array().items(Joi.object({
                    foo: Joi.string().required()
                }))
            });
            const input = { test: [{ foo: 'a' }, { bar: 2 }] };

            schema.validate(input, (err, value) => {

                expect(err.message).to.equal('child "test" fails because ["test" at position 1 fails because [child "foo" fails because ["foo" is required]]]');
                expect(err.details).to.equal([{
                    message: '"foo" is required',
                    path: ['test', 1, 'foo'],
                    type: 'any.required',
                    context: { label: 'foo', key: 'foo' }
                }]);
                done();
            });
        });

        it('validates multiple types added in two calls', (done) => {

            const schema = Joi.array()
                .items(Joi.number())
                .items(Joi.string());

            Helper.validate(schema, [
                [[1, 2, 3], true],
                [[50, 100, 1000], true],
                [[1, 'a', 5, 10], true],
                [['joi', 'everydaylowprices', 5000], true]
            ], done);
        });

        it('validates multiple types with stripUnknown', (done) => {

            const schema = Joi.array().items(Joi.number(), Joi.string()).options({ stripUnknown: true });

            Helper.validate(schema, [
                [[1, 2, 'a'], true, null, [1, 2, 'a']],
                [[1, { foo: 'bar' }, 'a', 2], true, null, [1, 'a', 2]]
            ], done);
        });

        it('validates multiple types with stripUnknown (as an object)', (done) => {

            const schema = Joi.array().items(Joi.number(), Joi.string()).options({ stripUnknown: { arrays: true, objects: false } });

            Helper.validate(schema, [
                [[1, 2, 'a'], true, null, [1, 2, 'a']],
                [[1, { foo: 'bar' }, 'a', 2], true, null, [1, 'a', 2]]
            ], done);
        });

        it('allows forbidden to restrict values', (done) => {

            const schema = Joi.array().items(Joi.string().valid('four').forbidden(), Joi.string());
            const input = ['one', 'two', 'three', 'four'];

            schema.validate(input, (err, value) => {

                expect(err).to.be.an.error('"value" at position 3 contains an excluded value');
                expect(err.details).to.equal([{
                    message: '"value" at position 3 contains an excluded value',
                    path: [3],
                    type: 'array.excludes',
                    context: { pos: 3, value: 'four', label: 'value', key: 3 }
                }]);
                done();
            });
        });

        it('allows forbidden to restrict values (ref)', (done) => {

            const schema = Joi.object({
                array: Joi.array().items(Joi.valid(Joi.ref('value')).forbidden(), Joi.string()),
                value: Joi.string().required()
            });

            const input = {
                array: ['one', 'two', 'three', 'four'],
                value: 'four'
            };

            schema.validate(input, (err, value) => {

                expect(err).to.be.an.error('child "array" fails because ["array" at position 3 contains an excluded value]');
                expect(err.details).to.equal([{
                    message: '"array" at position 3 contains an excluded value',
                    path: ['array', 3],
                    type: 'array.excludes',
                    context: { pos: 3, value: 'four', label: 'array', key: 3 }
                }]);
                done();
            });
        });

        it('validates that a required value exists', (done) => {

            const schema = Joi.array().items(Joi.string().valid('four').required(), Joi.string());
            const input = ['one', 'two', 'three'];

            schema.validate(input, (err, value) => {

                expect(err).to.be.an.error('"value" does not contain 1 required value(s)');
                expect(err.details).to.equal([{
                    message: '"value" does not contain 1 required value(s)',
                    path: [],
                    type: 'array.includesRequiredUnknowns',
                    context: { unknownMisses: 1, label: 'value', key: undefined }
                }]);
                done();
            });
        });

        it('validates that a required value exists with abortEarly = false', (done) => {

            const schema = Joi.array().items(Joi.string().valid('four').required(), Joi.string()).options({ abortEarly: false });
            const input = ['one', 'two', 'three'];

            schema.validate(input, (err, value) => {

                expect(err).to.be.an.error('"value" does not contain 1 required value(s)');
                expect(err.details).to.equal([{
                    message: '"value" does not contain 1 required value(s)',
                    path: [],
                    type: 'array.includesRequiredUnknowns',
                    context: { unknownMisses: 1, label: 'value', key: undefined }
                }]);
                done();
            });
        });

        it('does not re-run required tests that have already been matched', (done) => {

            const schema = Joi.array().items(Joi.string().valid('four').required(), Joi.string());
            const input = ['one', 'two', 'three', 'four', 'four', 'four'];

            schema.validate(input, (err, value) => {

                expect(err).to.not.exist();
                expect(value).to.equal(input);
                done();
            });
        });

        it('does not re-run required tests that have already failed', (done) => {

            const schema = Joi.array().items(Joi.string().valid('four').required(), Joi.boolean().required(), Joi.number());
            const input = ['one', 'two', 'three', 'four', 'four', 'four'];

            schema.validate(input, (err, value) => {

                expect(err).to.be.an.error('"value" at position 0 does not match any of the allowed types');
                expect(err.details).to.equal([{
                    message: '"value" at position 0 does not match any of the allowed types',
                    path: [0],
                    type: 'array.includes',
                    context: { pos: 0, value: 'one', label: 'value', key: 0 }
                }]);
                done();
            });
        });

        it('can require duplicates of the same schema and fail', (done) => {

            const schema = Joi.array().items(Joi.string().valid('four').required(), Joi.string().valid('four').required(), Joi.string());
            const input = ['one', 'two', 'three', 'four'];

            schema.validate(input, (err, value) => {

                expect(err).to.be.an.error('"value" does not contain 1 required value(s)');
                expect(err.details).to.equal([{
                    message: '"value" does not contain 1 required value(s)',
                    path: [],
                    type: 'array.includesRequiredUnknowns',
                    context: { unknownMisses: 1, label: 'value', key: undefined }
                }]);
                done();
            });
        });

        it('can require duplicates of the same schema and pass', (done) => {

            const schema = Joi.array().items(Joi.string().valid('four').required(), Joi.string().valid('four').required(), Joi.string());
            const input = ['one', 'two', 'three', 'four', 'four'];

            schema.validate(input, (err, value) => {

                expect(err).to.not.exist();
                expect(value).to.equal(input);
                done();
            });
        });

        it('continues to validate after a required match', (done) => {

            const schema = Joi.array().items(Joi.string().required(), Joi.boolean());
            const input = [true, 'one', false, 'two'];

            schema.validate(input, (err, value) => {

                expect(err).to.not.exist();
                expect(value).to.equal(input);
                done();
            });
        });

        it('can use a label on a required parameter', (done) => {

            const schema = Joi.array().items(Joi.string().required().label('required string'), Joi.boolean());
            const input = [true, false];

            schema.validate(input, (err, value) => {

                expect(err).to.be.an.error('"value" does not contain [required string]');
                expect(err.details).to.equal([{
                    message: '"value" does not contain [required string]',
                    path: [],
                    type: 'array.includesRequiredKnowns',
                    context: { knownMisses: ['required string'], label: 'value', key: undefined }
                }]);
                done();
            });
        });

        it('can use a label on one required parameter, and no label on another', (done) => {

            const schema = Joi.array().items(Joi.string().required().label('required string'), Joi.string().required(), Joi.boolean());
            const input = [true, false];

            schema.validate(input, (err, value) => {

                expect(err).to.be.an.error('"value" does not contain [required string] and 1 other required value(s)');
                expect(err.details).to.equal([{
                    message: '"value" does not contain [required string] and 1 other required value(s)',
                    path: [],
                    type: 'array.includesRequiredBoth',
                    context: {
                        knownMisses: ['required string'],
                        unknownMisses: 1,
                        label: 'value',
                        key: undefined
                    }
                }]);
                done();
            });
        });

        it('can strip matching items', (done) => {

            const schema = Joi.array().items(Joi.string(), Joi.any().strip());
            schema.validate(['one', 'two', 3, 4], (err, value) => {

                expect(err).to.not.exist();
                expect(value).to.equal(['one', 'two']);
                done();
            });
        });
    });

    describe('min()', () => {

        it('validates array size', (done) => {

            const schema = Joi.array().min(2);
            Helper.validate(schema, [
                [[1, 2], true],
                [[1], false, null, {
                    message: '"value" must contain at least 2 items',
                    details: [{
                        message: '"value" must contain at least 2 items',
                        path: [],
                        type: 'array.min',
                        context: { limit: 2, value: [1], label: 'value', key: undefined }
                    }]
                }]
            ], done);
        });

        it('throws when limit is not a number', (done) => {

            expect(() => {

                Joi.array().min('a');
            }).to.throw('limit must be a positive integer or reference');
            done();
        });

        it('throws when limit is not an integer', (done) => {

            expect(() => {

                Joi.array().min(1.2);
            }).to.throw('limit must be a positive integer or reference');
            done();
        });

        it('throws when limit is negative', (done) => {

            expect(() => {

                Joi.array().min(-1);
            }).to.throw('limit must be a positive integer or reference');
            done();
        });

        it('validates array size when a reference', (done) => {

            const ref = Joi.ref('limit');
            const schema = Joi.object().keys({
                limit: Joi.any(),
                arr: Joi.array().min(ref)
            });
            Helper.validate(schema, [
                [{
                    limit: 2,
                    arr: [1, 2]
                }, true],
                [{
                    limit: 2,
                    arr: [1]
                }, false, null, {
                    message: 'child "arr" fails because ["arr" must contain at least ref:limit items]',
                    details: [{
                        message: '"arr" must contain at least ref:limit items',
                        path: ['arr'],
                        type: 'array.min',
                        context: { limit: ref, value: [1], label: 'arr', key: 'arr' }
                    }]
                }]
            ], done);
        });

        it('handles references within a when', (done) => {

            const schema = Joi.object({
                limit: Joi.any(),
                arr: Joi.array(),
                arr2: Joi.when('arr', {
                    is: Joi.array().min(Joi.ref('limit')),
                    then: Joi.array()
                })
            });

            Helper.validate(schema, [
                [{
                    limit: 2,
                    arr: [1, 2],
                    arr2: [1, 2]
                }, true]
            ], done);
        });

        it('validates reference is a safe integer', (done) => {

            const schema = Joi.object().keys({
                limit: Joi.any(),
                arr: Joi.array().min(Joi.ref('limit'))
            });
            Helper.validate(schema, [
                [{
                    limit: Math.pow(2, 53),
                    arr: [1, 2]
                }, false, null, {
                    message: 'child "arr" fails because ["arr" references "limit" which is not a positive integer]',
                    details: [{
                        message: '"arr" references "limit" which is not a positive integer',
                        path: ['arr'],
                        type: 'array.ref',
                        context: { ref: 'limit', label: 'arr', key: 'arr' }
                    }]
                }],
                [{
                    limit: 'I like turtles',
                    arr: [1]
                }, false, null, {
                    message: 'child "arr" fails because ["arr" references "limit" which is not a positive integer]',
                    details: [{
                        message: '"arr" references "limit" which is not a positive integer',
                        path: ['arr'],
                        type: 'array.ref',
                        context: { ref: 'limit', label: 'arr', key: 'arr' }
                    }]
                }]
            ], done);
        });

    });

    describe('max()', () => {

        it('validates array size', (done) => {

            const schema = Joi.array().max(1);
            Helper.validate(schema, [
                [[1, 2], false, null, {
                    message: '"value" must contain less than or equal to 1 items',
                    details: [{
                        message: '"value" must contain less than or equal to 1 items',
                        path: [],
                        type: 'array.max',
                        context: { limit: 1, value: [1, 2], label: 'value', key: undefined }
                    }]
                }],
                [[1], true]
            ], done);
        });

        it('throws when limit is not a number', (done) => {

            expect(() => {

                Joi.array().max('a');
            }).to.throw('limit must be a positive integer or reference');
            done();
        });

        it('throws when limit is not an integer', (done) => {

            expect(() => {

                Joi.array().max(1.2);
            }).to.throw('limit must be a positive integer or reference');
            done();
        });

        it('throws when limit is negative', (done) => {

            expect(() => {

                Joi.array().max(-1);
            }).to.throw('limit must be a positive integer or reference');
            done();
        });

        it('validates array size when a reference', (done) => {

            const ref = Joi.ref('limit');
            const schema = Joi.object().keys({
                limit: Joi.any(),
                arr: Joi.array().max(ref)
            });
            Helper.validate(schema, [
                [{
                    limit: 2,
                    arr: [1, 2]
                }, true],
                [{
                    limit: 2,
                    arr: [1, 2, 3]
                }, false, null, {
                    message: 'child "arr" fails because ["arr" must contain less than or equal to ref:limit items]',
                    details: [{
                        message: '"arr" must contain less than or equal to ref:limit items',
                        path: ['arr'],
                        type: 'array.max',
                        context: { limit: ref, value: [1, 2, 3], label: 'arr', key: 'arr' }
                    }]
                }]
            ], done);
        });

        it('handles references within a when', (done) => {

            const schema = Joi.object({
                limit: Joi.any(),
                arr: Joi.array(),
                arr2: Joi.when('arr', {
                    is: Joi.array().max(Joi.ref('limit')),
                    then: Joi.array()
                })
            });

            Helper.validate(schema, [
                [{
                    limit: 2,
                    arr: [1, 2],
                    arr2: [1, 2]
                }, true]
            ], done);
        });

        it('validates reference is a safe integer', (done) => {

            const schema = Joi.object().keys({
                limit: Joi.any(),
                arr: Joi.array().max(Joi.ref('limit'))
            });
            Helper.validate(schema, [
                [{
                    limit: Math.pow(2, 53),
                    arr: [1, 2]
                }, false, null, {
                    message: 'child "arr" fails because ["arr" references "limit" which is not a positive integer]',
                    details: [{
                        message: '"arr" references "limit" which is not a positive integer',
                        path: ['arr'],
                        type: 'array.ref',
                        context: { ref: 'limit', label: 'arr', key: 'arr' }
                    }]
                }],
                [{
                    limit: 'I like turtles',
                    arr: [1]
                }, false, null, {
                    message: 'child "arr" fails because ["arr" references "limit" which is not a positive integer]',
                    details: [{
                        message: '"arr" references "limit" which is not a positive integer',
                        path: ['arr'],
                        type: 'array.ref',
                        context: { ref: 'limit', label: 'arr', key: 'arr' }
                    }]
                }]
            ], done);
        });

    });

    describe('length()', () => {

        it('validates array size', (done) => {

            const schema = Joi.array().length(2);
            Helper.validate(schema, [
                [[1, 2], true],
                [[1], false, null, {
                    message: '"value" must contain 2 items',
                    details: [{
                        message: '"value" must contain 2 items',
                        path: [],
                        type: 'array.length',
                        context: { limit: 2, value: [1], label: 'value', key: undefined }
                    }]
                }]
            ], done);
        });

        it('throws when limit is not a number', (done) => {

            expect(() => {

                Joi.array().length('a');
            }).to.throw('limit must be a positive integer or reference');
            done();
        });

        it('throws when limit is not an integer', (done) => {

            expect(() => {

                Joi.array().length(1.2);
            }).to.throw('limit must be a positive integer or reference');
            done();
        });

        it('throws when limit is negative', (done) => {

            expect(() => {

                Joi.array().length(-1);
            }).to.throw('limit must be a positive integer or reference');
            done();
        });

        it('validates array size when a reference', (done) => {

            const ref = Joi.ref('limit');
            const schema = Joi.object().keys({
                limit: Joi.any(),
                arr: Joi.array().length(ref)
            });
            Helper.validate(schema, [
                [{
                    limit: 2,
                    arr: [1, 2]
                }, true],
                [{
                    limit: 2,
                    arr: [1]
                }, false, null, {
                    message: 'child "arr" fails because ["arr" must contain ref:limit items]',
                    details: [{
                        message: '"arr" must contain ref:limit items',
                        path: ['arr'],
                        type: 'array.length',
                        context: { limit: ref, value: [1], label: 'arr', key: 'arr' }
                    }]
                }]
            ], done);
        });

        it('handles references within a when', (done) => {

            const schema = Joi.object({
                limit: Joi.any(),
                arr: Joi.array(),
                arr2: Joi.when('arr', {
                    is: Joi.array().length(Joi.ref('limit')),
                    then: Joi.array()
                })
            });

            Helper.validate(schema, [
                [{
                    limit: 2,
                    arr: [1, 2],
                    arr2: [1, 2]
                }, true]
            ], done);
        });

        it('validates reference is a safe integer', (done) => {

            const schema = Joi.object().keys({
                limit: Joi.any(),
                arr: Joi.array().length(Joi.ref('limit'))
            });
            Helper.validate(schema, [
                [{
                    limit: Math.pow(2, 53),
                    arr: [1, 2]
                }, false, null, {
                    message: 'child "arr" fails because ["arr" references "limit" which is not a positive integer]',
                    details: [{
                        message: '"arr" references "limit" which is not a positive integer',
                        path: ['arr'],
                        type: 'array.ref',
                        context: { ref: 'limit', label: 'arr', key: 'arr' }
                    }]
                }],
                [{
                    limit: 'I like turtles',
                    arr: [1]
                }, false, null, {
                    message: 'child "arr" fails because ["arr" references "limit" which is not a positive integer]',
                    details: [{
                        message: '"arr" references "limit" which is not a positive integer',
                        path: ['arr'],
                        type: 'array.ref',
                        context: { ref: 'limit', label: 'arr', key: 'arr' }
                    }]
                }]
            ], done);
        });
    });

    describe('validate()', () => {

        it('should, by default, allow undefined, allow empty array', (done) => {

            Helper.validate(Joi.array(), [
                [undefined, true],
                [[], true]
            ], done);
        });

        it('should, when .required(), deny undefined', (done) => {

            Helper.validate(Joi.array().required(), [
                [undefined, false, null, {
                    message: '"value" is required',
                    details: [{
                        message: '"value" is required',
                        path: [],
                        type: 'any.required',
                        context: { label: 'value', key: undefined }
                    }]
                }]
            ], done);
        });

        it('allows empty arrays', (done) => {

            Helper.validate(Joi.array(), [
                [undefined, true],
                [[], true]
            ], done);
        });

        it('excludes values when items are forbidden', (done) => {

            Helper.validate(Joi.array().items(Joi.string().forbidden()), [
                [['2', '1'], false, null, {
                    message: '"value" at position 0 contains an excluded value',
                    details: [{
                        message: '"value" at position 0 contains an excluded value',
                        path: [0],
                        type: 'array.excludes',
                        context: { pos: 0, value: '2', label: 'value', key: 0 }
                    }]
                }],
                [['1'], false, null, {
                    message: '"value" at position 0 contains an excluded value',
                    details: [{
                        message: '"value" at position 0 contains an excluded value',
                        path: [0],
                        type: 'array.excludes',
                        context: { pos: 0, value: '1', label: 'value', key: 0 }
                    }]
                }],
                [[2], true]
            ], done);
        });

        it('allows types to be forbidden', (done) => {

            const schema = Joi.array().items(Joi.number().forbidden());

            const n = [1, 2, 'hippo'];
            schema.validate(n, (err, value) => {

                expect(err).to.be.an.error('"value" at position 0 contains an excluded value');
                expect(err.details).to.equal([{
                    message: '"value" at position 0 contains an excluded value',
                    path: [0],
                    type: 'array.excludes',
                    context: { pos: 0, value: 1, label: 'value', key: 0 }
                }]);

                const m = ['x', 'y', 'z'];
                schema.validate(m, (err2, value2) => {

                    expect(err2).to.not.exist();
                    done();
                });
            });
        });

        it('validates array of Numbers', (done) => {

            Helper.validate(Joi.array().items(Joi.number()), [
                [[1, 2, 3], true],
                [[50, 100, 1000], true],
                [['a', 1, 2], false, null, {
                    message: '"value" at position 0 fails because ["0" must be a number]',
                    details: [{
                        message: '"0" must be a number',
                        path: [0],
                        type: 'number.base',
                        context: { label: 0, key: 0 }
                    }]
                }],
                [['1', '2', 4], true]
            ], done);
        });

        it('validates array of mixed Numbers & Strings', (done) => {

            Helper.validate(Joi.array().items(Joi.number(), Joi.string()), [
                [[1, 2, 3], true],
                [[50, 100, 1000], true],
                [[1, 'a', 5, 10], true],
                [['joi', 'everydaylowprices', 5000], true]
            ], done);
        });

        it('validates array of objects with schema', (done) => {

            Helper.validate(Joi.array().items(Joi.object({ h1: Joi.number().required() })), [
                [[{ h1: 1 }, { h1: 2 }, { h1: 3 }], true],
                [[{ h2: 1, h3: 'somestring' }, { h1: 2 }, { h1: 3 }], false, null, {
                    message: '"value" at position 0 fails because [child "h1" fails because ["h1" is required]]',
                    details: [{
                        message: '"h1" is required',
                        path: [0, 'h1'],
                        type: 'any.required',
                        context: { label: 'h1', key: 'h1' }
                    }]
                }],
                [[1, 2, [1]], false, null, {
                    message: '"value" at position 0 fails because ["0" must be an object]',
                    details: [{
                        message: '"0" must be an object',
                        path: [0],
                        type: 'object.base',
                        context: { label: 0, key: 0 }
                    }]
                }]
            ], done);
        });

        it('errors on array of unallowed mixed types (Array)', (done) => {

            Helper.validate(Joi.array().items(Joi.number()), [
                [[1, 2, 3], true],
                [[1, 2, [1]], false, null, {
                    message: '"value" at position 2 fails because ["2" must be a number]',
                    details: [{
                        message: '"2" must be a number',
                        path: [2],
                        type: 'number.base',
                        context: { label: 2, key: 2 }
                    }]
                }]
            ], done);
        });

        it('errors on invalid number rule using includes', (done) => {

            const schema = Joi.object({
                arr: Joi.array().items(Joi.number().integer())
            });

            const input = { arr: [1, 2, 2.1] };
            schema.validate(input, (err, value) => {

                expect(err).to.be.an.error('child "arr" fails because ["arr" at position 2 fails because ["2" must be an integer]]');
                expect(err.details).to.equal([{
                    message: '"2" must be an integer',
                    path: ['arr', 2],
                    type: 'number.integer',
                    context: { value: 2.1, label: 2, key: 2 }
                }]);
                done();
            });
        });

        it('validates an array within an object', (done) => {

            const schema = Joi.object({
                array: Joi.array().items(Joi.string().min(5), Joi.number().min(3))
            }).options({ convert: false });

            Helper.validate(schema, [
                [{ array: ['12345'] }, true],
                [{ array: ['1'] }, false, null, {
                    message: 'child "array" fails because ["array" at position 0 does not match any of the allowed types]',
                    details: [{
                        message: '"array" at position 0 does not match any of the allowed types',
                        path: ['array', 0],
                        type: 'array.includes',
                        context: { pos: 0, value: '1', label: 'array', key: 0 }
                    }]
                }],
                [{ array: [3] }, true],
                [{ array: ['12345', 3] }, true]
            ], done);
        });

        it('should not change original value', (done) => {

            const schema = Joi.array().items(Joi.number()).unique();
            const input = ['1', '2'];

            schema.validate(input, (err, value) => {

                expect(err).to.not.exist();
                expect(value).to.equal([1, 2]);
                expect(input).to.equal(['1', '2']);
                done();
            });
        });

        it('should have multiple errors if abort early is false', (done) => {

            const schema = Joi.array().items(Joi.number(), Joi.object()).items(Joi.boolean().forbidden());
            const input = [1, undefined, true, 'a'];

            Joi.validate(input, schema, { abortEarly: false }, (err, value) => {

                expect(err).to.be.an.error('"value" must not be a sparse array. "value" at position 2 contains an excluded value. "value" at position 3 does not match any of the allowed types');
                expect(err.details).to.equal([{
                    message: '"value" must not be a sparse array',
                    path: [1],
                    type: 'array.sparse',
                    context: {
                        key: 1,
                        label: 'value'
                    }
                }, {
                    message: '"value" at position 2 contains an excluded value',
                    path: [2],
                    type: 'array.excludes',
                    context: {
                        pos: 2,
                        key: 2,
                        label: 'value',
                        value: true
                    }
                }, {
                    message: '"value" at position 3 does not match any of the allowed types',
                    path: [3],
                    type: 'array.includes',
                    context: {
                        pos: 3,
                        key: 3,
                        label: 'value',
                        value: 'a'
                    }
                }]);
                done();
            });
        });
    });

    describe('describe()', () => {

        it('returns an empty description when no rules are applied', (done) => {

            const schema = Joi.array();
            const desc = schema.describe();
            expect(desc).to.equal({
                type: 'array',
                flags: { sparse: false }
            });
            done();
        });

        it('returns an updated description when sparse rule is applied', (done) => {

            const schema = Joi.array().sparse();
            const desc = schema.describe();
            expect(desc).to.equal({
                type: 'array',
                flags: { sparse: true }
            });
            done();
        });

        it('returns an items array only if items are specified', (done) => {

            const schema = Joi.array().items().max(5);
            const desc = schema.describe();
            expect(desc.items).to.not.exist();
            done();
        });

        it('returns a recursively defined array of items when specified', (done) => {

            const schema = Joi.array()
                .items(Joi.number(), Joi.string())
                .items(Joi.boolean().forbidden())
                .ordered(Joi.number(), Joi.string())
                .ordered(Joi.string().required());
            const desc = schema.describe();
            expect(desc.items).to.have.length(3);
            expect(desc).to.equal({
                type: 'array',
                flags: { sparse: false },
                orderedItems: [
                    { type: 'number', invalids: [Infinity, -Infinity] },
                    { type: 'string', invalids: [''] },
                    { type: 'string', invalids: [''], flags: { presence: 'required' } }
                ],
                items: [
                    { type: 'number', invalids: [Infinity, -Infinity] },
                    { type: 'string', invalids: [''] },
                    { type: 'boolean', flags: { presence: 'forbidden', insensitive: true }, truthy: [true], falsy: [false] }
                ]
            });

            done();
        });
    });

    describe('unique()', () => {

        it('errors if duplicate numbers, strings, objects, binaries, functions, dates and booleans', (done) => {

            const buffer = new Buffer('hello world');
            const func = function () {};
            const now = new Date();
            const schema = Joi.array().sparse().unique();

            Helper.validate(schema, [
                [[2, 2], false, null, {
                    message: '"value" position 1 contains a duplicate value',
                    details: [{
                        message: '"value" position 1 contains a duplicate value',
                        path: [1],
                        type: 'array.unique',
                        context: {
                            pos: 1,
                            value: 2,
                            dupePos: 0,
                            dupeValue: 2,
                            label: 'value',
                            key: 1
                        }
                    }]
                }],
                [[0x2, 2], false, null, {
                    message: '"value" position 1 contains a duplicate value',
                    details: [{
                        message: '"value" position 1 contains a duplicate value',
                        path: [1],
                        type: 'array.unique',
                        context: {
                            pos: 1,
                            value: 2,
                            dupePos: 0,
                            dupeValue: 0x2,
                            label: 'value',
                            key: 1
                        }
                    }]
                }],
                [['duplicate', 'duplicate'], false, null, {
                    message: '"value" position 1 contains a duplicate value',
                    details: [{
                        message: '"value" position 1 contains a duplicate value',
                        path: [1],
                        type: 'array.unique',
                        context: {
                            pos: 1,
                            value: 'duplicate',
                            dupePos: 0,
                            dupeValue: 'duplicate',
                            label: 'value',
                            key: 1
                        }
                    }]
                }],
                [[{ a: 'b' }, { a: 'b' }], false, null, {
                    message: '"value" position 1 contains a duplicate value',
                    details: [{
                        message: '"value" position 1 contains a duplicate value',
                        path: [1],
                        type: 'array.unique',
                        context: {
                            pos: 1,
                            value: { a: 'b' },
                            dupePos: 0,
                            dupeValue: { a: 'b' },
                            label: 'value',
                            key: 1
                        }
                    }]
                }],
                [[buffer, buffer], false, null, {
                    message: '"value" position 1 contains a duplicate value',
                    details: [{
                        message: '"value" position 1 contains a duplicate value',
                        path: [1],
                        type: 'array.unique',
                        context: {
                            pos: 1,
                            value: buffer,
                            dupePos: 0,
                            dupeValue: buffer,
                            label: 'value',
                            key: 1
                        }
                    }]
                }],
                [[func, func], false, null, {
                    message: '"value" position 1 contains a duplicate value',
                    details: [{
                        message: '"value" position 1 contains a duplicate value',
                        path: [1],
                        type: 'array.unique',
                        context: {
                            pos: 1,
                            value: func,
                            dupePos: 0,
                            dupeValue: func,
                            label: 'value',
                            key: 1
                        }
                    }]
                }],
                [[now, now], false, null, {
                    message: '"value" position 1 contains a duplicate value',
                    details: [{
                        message: '"value" position 1 contains a duplicate value',
                        path: [1],
                        type: 'array.unique',
                        context: {
                            pos: 1,
                            value: now,
                            dupePos: 0,
                            dupeValue: now,
                            label: 'value',
                            key: 1
                        }
                    }]
                }],
                [[true, true], false, null, {
                    message: '"value" position 1 contains a duplicate value',
                    details: [{
                        message: '"value" position 1 contains a duplicate value',
                        path: [1],
                        type: 'array.unique',
                        context: {
                            pos: 1,
                            value: true,
                            dupePos: 0,
                            dupeValue: true,
                            label: 'value',
                            key: 1
                        }
                    }]
                }],
                [[undefined, undefined], false, null, {
                    message: '"value" position 1 contains a duplicate value',
                    details: [{
                        message: '"value" position 1 contains a duplicate value',
                        path: [1],
                        type: 'array.unique',
                        context: {
                            pos: 1,
                            value: undefined,
                            dupePos: 0,
                            dupeValue: undefined,
                            label: 'value',
                            key: 1
                        }
                    }]
                }]
            ], done);
        });

        it('errors with the correct details', (done) => {

            let error = Joi.array().items(Joi.number()).unique().validate([1, 2, 3, 1, 4]).error;
            expect(error).to.be.an.error('"value" position 3 contains a duplicate value');
            expect(error.details).to.equal([{
                context: {
                    key: 3,
                    label: 'value',
                    pos: 3,
                    value: 1,
                    dupePos: 0,
                    dupeValue: 1
                },
                message: '"value" position 3 contains a duplicate value',
                path: [3],
                type: 'array.unique'
            }]);

            error = Joi.array().items(Joi.number()).unique((a, b) => a === b).validate([1, 2, 3, 1, 4]).error;
            expect(error).to.be.an.error('"value" position 3 contains a duplicate value');
            expect(error.details).to.equal([{
                context: {
                    key: 3,
                    label: 'value',
                    pos: 3,
                    value: 1,
                    dupePos: 0,
                    dupeValue: 1
                },
                message: '"value" position 3 contains a duplicate value',
                path: [3],
                type: 'array.unique'
            }]);

            error = Joi.object({ a: Joi.array().items(Joi.number()).unique() }).validate({ a: [1, 2, 3, 1, 4] }).error;
            expect(error).to.be.an.error('child "a" fails because ["a" position 3 contains a duplicate value]');
            expect(error.details).to.equal([{
                context: {
                    key: 3,
                    label: 'a',
                    pos: 3,
                    value: 1,
                    dupePos: 0,
                    dupeValue: 1
                },
                message: '"a" position 3 contains a duplicate value',
                path: ['a', 3],
                type: 'array.unique'
            }]);

            error = Joi.object({ a: Joi.array().items(Joi.number()).unique((a, b) => a === b) }).validate({ a: [1, 2, 3, 1, 4] }).error;
            expect(error).to.be.an.error('child "a" fails because ["a" position 3 contains a duplicate value]');
            expect(error.details).to.equal([{
                context: {
                    key: 3,
                    label: 'a',
                    pos: 3,
                    value: 1,
                    dupePos: 0,
                    dupeValue: 1
                },
                message: '"a" position 3 contains a duplicate value',
                path: ['a', 3],
                type: 'array.unique'
            }]);

            done();
        });

        it('ignores duplicates if they are of different types', (done) => {

            const schema = Joi.array().unique();

            Helper.validate(schema, [
                [[2, '2'], true]
            ], done);
        });

        it('validates without duplicates', (done) => {

            const buffer = new Buffer('hello world');
            const buffer2 = new Buffer('Hello world');
            const func = function () {};
            const func2 = function () {};
            const now = new Date();
            const now2 = new Date(+now + 100);
            const schema = Joi.array().unique();

            Helper.validate(schema, [
                [[1, 2], true],
                [['s1', 's2'], true],
                [[{ a: 'b' }, { a: 'c' }], true],
                [[buffer, buffer2], true],
                [[func, func2], true],
                [[now, now2], true],
                [[true, false], true]
            ], done);
        });

        it('validates using a comparator', (done) => {

            const schema = Joi.array().unique((left, right) => left.a === right.a);

            Helper.validate(schema, [
                [[{ a: 'b' }, { a: 'c' }], true],
                [[{ a: 'b', c: 'd' }, { a: 'c', c: 'd' }], true],
                [[{ a: 'b', c: 'd' }, { a: 'b', c: 'd' }], false, null, {
                    message: '"value" position 1 contains a duplicate value',
                    details: [{
                        message: '"value" position 1 contains a duplicate value',
                        path: [1],
                        type: 'array.unique',
                        context: {
                            pos: 1,
                            value: { a: 'b', c: 'd' },
                            dupePos: 0,
                            dupeValue: { a: 'b', c: 'd' },
                            label: 'value',
                            key: 1
                        }
                    }]
                }],
                [[{ a: 'b', c: 'c' }, { a: 'b', c: 'd' }], false, null, {
                    message: '"value" position 1 contains a duplicate value',
                    details: [{
                        message: '"value" position 1 contains a duplicate value',
                        path: [1],
                        type: 'array.unique',
                        context: {
                            pos: 1,
                            value: { a: 'b', c: 'd' },
                            dupePos: 0,
                            dupeValue: { a: 'b', c: 'c' },
                            label: 'value',
                            key: 1
                        }
                    }]
                }]
            ], done);
        });

        it('validates using a comparator with different types', (done) => {

            const schema = Joi.array().items(Joi.string(), Joi.object({ a: Joi.string() })).unique((left, right) => {

                if (typeof left === 'object') {
                    if (typeof right === 'object') {
                        return left.a === right.a;
                    }

                    return left.a === right;
                }

                if (typeof right === 'object') {
                    return left === right.a;
                }

                return left === right;
            });

            Helper.validate(schema, [
                [[{ a: 'b' }, { a: 'c' }], true],
                [[{ a: 'b' }, 'c'], true],
                [[{ a: 'b' }, 'c', { a: 'd' }, 'e'], true],
                [[{ a: 'b' }, { a: 'b' }], false, null, {
                    message: '"value" position 1 contains a duplicate value',
                    details: [{
                        message: '"value" position 1 contains a duplicate value',
                        path: [1],
                        type: 'array.unique',
                        context: {
                            pos: 1,
                            value: { a: 'b' },
                            dupePos: 0,
                            dupeValue: { a: 'b' },
                            label: 'value',
                            key: 1
                        }
                    }]
                }],
                [[{ a: 'b' }, 'b'], false, null, {
                    message: '"value" position 1 contains a duplicate value',
                    details: [{
                        message: '"value" position 1 contains a duplicate value',
                        path: [1],
                        type: 'array.unique',
                        context: {
                            pos: 1,
                            value: 'b',
                            dupePos: 0,
                            dupeValue: { a: 'b' },
                            label: 'value',
                            key: 1
                        }
                    }]
                }]
            ], done);
        });

        it('validates using a path comparator', (done) => {

            let schema = Joi.array().items(Joi.object({ id: Joi.number() })).unique('id');

            Helper.validate(schema, [
                [[{ id: 1 }, { id: 2 }, { id: 3 }], true],
                [[{ id: 1 }, { id: 2 }, {}], true],
                [[{ id: 1 }, { id: 2 }, { id: 1 }], false, null, {
                    message: '"value" position 2 contains a duplicate value',
                    details: [{
                        context: {
                            dupePos: 0,
                            dupeValue: { id: 1 },
                            key: 2,
                            label: 'value',
                            path: 'id',
                            pos: 2,
                            value: { id: 1 }
                        },
                        message: '"value" position 2 contains a duplicate value',
                        path: [2],
                        type: 'array.unique'
                    }]
                }],
                [[{ id: 1 }, { id: 2 }, {}, { id: 3 }, {}], false, null, {
                    message: '"value" position 4 contains a duplicate value',
                    details: [{
                        context: {
                            dupePos: 2,
                            dupeValue: {},
                            key: 4,
                            label: 'value',
                            path: 'id',
                            pos: 4,
                            value: {}
                        },
                        message: '"value" position 4 contains a duplicate value',
                        path: [4],
                        type: 'array.unique'
                    }]
                }]
            ]);

            schema = Joi.array().items(Joi.object({ nested: { id: Joi.number() } })).unique('nested.id');

            Helper.validate(schema, [
                [[{ nested: { id: 1 } }, { nested: { id: 2 } }, { nested: { id: 3 } }], true],
                [[{ nested: { id: 1 } }, { nested: { id: 2 } }, {}], true],
                [[{ nested: { id: 1 } }, { nested: { id: 2 } }, { nested: { id: 1 } }], false, null, {
                    message: '"value" position 2 contains a duplicate value',
                    details: [{
                        context: {
                            dupePos: 0,
                            dupeValue: { nested: { id: 1 } },
                            key: 2,
                            label: 'value',
                            path: 'nested.id',
                            pos: 2,
                            value: { nested: { id: 1 } }
                        },
                        message: '"value" position 2 contains a duplicate value',
                        path: [2],
                        type: 'array.unique'
                    }]
                }],
                [[{ nested: { id: 1 } }, { nested: { id: 2 } }, {}, { nested: { id: 3 } }, {}], false, null, {
                    message: '"value" position 4 contains a duplicate value',
                    details: [{
                        context: {
                            dupePos: 2,
                            dupeValue: {},
                            key: 4,
                            label: 'value',
                            path: 'nested.id',
                            pos: 4,
                            value: {}
                        },
                        message: '"value" position 4 contains a duplicate value',
                        path: [4],
                        type: 'array.unique'
                    }]
                }]
            ]);

            schema = Joi.array().items(Joi.object({ nested: { id: Joi.number() } })).unique('nested');

            Helper.validate(schema, [
                [[{ nested: { id: 1 } }, { nested: { id: 2 } }, { nested: { id: 3 } }], true],
                [[{ nested: { id: 1 } }, { nested: { id: 2 } }, {}], true],
                [[{ nested: { id: 1 } }, { nested: { id: 2 } }, { nested: { id: 1 } }], false, null, {
                    message: '"value" position 2 contains a duplicate value',
                    details: [{
                        context: {
                            dupePos: 0,
                            dupeValue: { nested: { id: 1 } },
                            key: 2,
                            label: 'value',
                            path: 'nested',
                            pos: 2,
                            value: { nested: { id: 1 } }
                        },
                        message: '"value" position 2 contains a duplicate value',
                        path: [2],
                        type: 'array.unique'
                    }]
                }],
                [[{ nested: { id: 1 } }, { nested: { id: 2 } }, {}, { nested: { id: 3 } }, {}], false, null, {
                    message: '"value" position 4 contains a duplicate value',
                    details: [{
                        context: {
                            dupePos: 2,
                            dupeValue: {},
                            key: 4,
                            label: 'value',
                            path: 'nested',
                            pos: 4,
                            value: {}
                        },
                        message: '"value" position 4 contains a duplicate value',
                        path: [4],
                        type: 'array.unique'
                    }]
                }]
            ]);

            done();
        });

        it('fails with invalid comparator', (done) => {

            expect(() => {

                Joi.array().unique({});
            }).to.throw(Error, 'comparator must be a function or a string');

            done();
        });

    });

    describe('sparse()', () => {

        it('errors on undefined value', (done) => {

            const schema = Joi.array().items(Joi.number());

            Helper.validate(schema, [
                [[undefined], false, null, {
                    message: '"value" must not be a sparse array',
                    details: [{
                        message: '"value" must not be a sparse array',
                        path: [0],
                        type: 'array.sparse',
                        context: { label: 'value', key: 0 }
                    }]
                }],
                [[2, undefined], false, null, {
                    message: '"value" must not be a sparse array',
                    details: [{
                        message: '"value" must not be a sparse array',
                        path: [1],
                        type: 'array.sparse',
                        context: { label: 'value', key: 1 }
                    }]
                }]
            ], done);
        });

        it('errors on undefined value after validation', (done) => {

            const schema = Joi.array().items(Joi.object().empty({}));

            Helper.validate(schema, [
                [[{ a: 1 }, {}, { c: 3 }], false, null, {
                    message: '"value" must not be a sparse array',
                    details: [{
                        message: '"value" must not be a sparse array',
                        path: [1],
                        type: 'array.sparse',
                        context: { label: 'value', key: 1 }
                    }]
                }]
            ], done);
        });

        it('errors on undefined value after validation with abortEarly false', (done) => {

            const schema = Joi.array().items(Joi.object().empty({})).options({ abortEarly: false });

            Helper.validate(schema, [
                [[{ a: 1 }, {}, 3], false, null, {
                    message: '"value" must not be a sparse array. "value" at position 2 fails because ["2" must be an object]',
                    details: [
                        {
                            message: '"value" must not be a sparse array',
                            path: [1],
                            type: 'array.sparse',
                            context: { label: 'value', key: 1 }
                        },
                        {
                            message: '"2" must be an object',
                            path: [2],
                            type: 'object.base',
                            context: { label: 2, key: 2 }
                        }
                    ]
                }]
            ], done);
        });

        it('errors on undefined value after validation with required', (done) => {

            const schema = Joi.array().items(Joi.object().empty({}).required());

            Helper.validate(schema, [
                [[{}, { c: 3 }], false, null, {
                    message: '"value" at position 0 fails because ["0" is required]',
                    details: [{
                        message: '"0" is required',
                        path: [0],
                        type: 'any.required',
                        context: { label: 0, key: 0 }
                    }]
                }]
            ], done);
        });

        it('errors on undefined value after custom validation with required', (done) => {

            const customJoi = Joi.extend({
                name: 'myType',
                rules: [
                    {
                        name: 'foo',
                        validate(params, value, state, options) {

                            return undefined;
                        }
                    }
                ]
            });

            const schema = Joi.array().items(customJoi.myType().foo().required());

            Helper.validate(schema, [
                [[{}, { c: 3 }], false, null, {
                    message: '"value" must not be a sparse array',
                    details: [{
                        message: '"value" must not be a sparse array',
                        path: [0],
                        type: 'array.sparse',
                        context: { label: 'value', key: 0 }
                    }]
                }]
            ], done);
        });

        it('errors on undefined value after custom validation with required and abortEarly false', (done) => {

            const customJoi = Joi.extend({
                name: 'myType',
                rules: [
                    {
                        name: 'foo',
                        validate(params, value, state, options) {

                            return undefined;
                        }
                    }
                ]
            });

            const schema = Joi.array().items(customJoi.myType().foo().required()).options({ abortEarly: false });

            Helper.validate(schema, [
                [[{}, { c: 3 }], false, null, {
                    message: '"value" must not be a sparse array. "value" must not be a sparse array',
                    details: [
                        {
                            message: '"value" must not be a sparse array',
                            path: [0],
                            type: 'array.sparse',
                            context: { label: 'value', key: 0 }
                        },
                        {
                            message: '"value" must not be a sparse array',
                            path: [1],
                            type: 'array.sparse',
                            context: { label: 'value', key: 1 }
                        }
                    ]
                }]
            ], done);
        });

        it('errors on undefined value after validation with required and abortEarly false', (done) => {

            const schema = Joi.array().items(Joi.object().empty({}).required()).options({ abortEarly: false });

            Helper.validate(schema, [
                [[{}, 3], false, null, {
                    message: '"value" at position 0 fails because ["0" is required]. "value" at position 1 fails because ["1" must be an object]. "value" does not contain 1 required value(s)',
                    details: [
                        {
                            message: '"0" is required',
                            path: [0],
                            type: 'any.required',
                            context: { label: 0, key: 0 }
                        },
                        {
                            message: '"1" must be an object',
                            path: [1],
                            type: 'object.base',
                            context: { label: 1, key: 1 }
                        },
                        {
                            message: '"value" does not contain 1 required value(s)',
                            path: [],
                            type: 'array.includesRequiredUnknowns',
                            context: { unknownMisses: 1, label: 'value', key: undefined }
                        }
                    ]
                }]
            ], done);
        });

        it('errors on undefined value after validation with ordered', (done) => {

            const schema = Joi.array().ordered(Joi.object().empty({}));

            Helper.validate(schema, [
                [[{}], false, null, {
                    message: '"value" must not be a sparse array',
                    details: [{
                        message: '"value" must not be a sparse array',
                        path: [0],
                        type: 'array.sparse',
                        context: { label: 'value', key: 0 }
                    }]
                }]
            ], done);
        });

        it('errors on undefined value after validation with ordered and abortEarly false', (done) => {

            const schema = Joi.array().ordered(Joi.object().empty({})).options({ abortEarly: false });

            Helper.validate(schema, [
                [[{}, 3], false, null, {
                    message: '"value" must not be a sparse array. "value" at position 1 fails because array must contain at most 1 items',
                    details: [
                        {
                            message: '"value" must not be a sparse array',
                            path: [0],
                            type: 'array.sparse',
                            context: { label: 'value', key: 0 }
                        },
                        {
                            message: '"value" at position 1 fails because array must contain at most 1 items',
                            path: [1],
                            type: 'array.orderedLength',
                            context: { pos: 1, limit: 1, label: 'value', key: 1 }
                        }
                    ]
                }]
            ], done);
        });

        it('validates on undefined value with sparse', (done) => {

            const schema = Joi.array().items(Joi.number()).sparse();

            Helper.validate(schema, [
                [[undefined], true],
                [[2, undefined], true]
            ], done);
        });

        it('validates on undefined value after validation', (done) => {

            const schema = Joi.array().items(Joi.object().empty({})).sparse();

            Helper.validate(schema, [
                [[{ a: 1 }, {}, { c: 3 }], true, null, [{ a: 1 }, undefined, { c: 3 }]]
            ], done);
        });

        it('validates on undefined value after validation with required', (done) => {

            const schema = Joi.array().items(Joi.object().empty({}).required()).sparse();

            Helper.validate(schema, [
                [[{ a: 1 }, {}, { c: 3 }], false, null, {
                    message: '"value" at position 1 fails because ["1" is required]',
                    details: [{
                        message: '"1" is required',
                        path: [1],
                        type: 'any.required',
                        context: { label: 1, key: 1 }
                    }]
                }]
            ], done);
        });

        it('validates on undefined value after validation with ordered', (done) => {

            const schema = Joi.array().ordered(Joi.object().empty({})).sparse();

            Helper.validate(schema, [
                [[{}], true, null, [undefined]]
            ], done);
        });

        it('switches the sparse flag', (done) => {

            const schema = Joi.array().sparse();
            const desc = schema.describe();
            expect(desc).to.equal({
                type: 'array',
                flags: { sparse: true }
            });
            done();
        });

        it('switches the sparse flag with explicit value', (done) => {

            const schema = Joi.array().sparse(true);
            const desc = schema.describe();
            expect(desc).to.equal({
                type: 'array',
                flags: { sparse: true }
            });
            done();
        });

        it('switches the sparse flag back', (done) => {

            const schema = Joi.array().sparse().sparse(false);
            const desc = schema.describe();
            expect(desc).to.equal({
                type: 'array',
                flags: { sparse: false }
            });
            done();
        });

        it('avoids unnecessary cloning when called twice', (done) => {

            const schema = Joi.array().sparse();
            expect(schema.sparse()).to.shallow.equal(schema);
            done();
        });
    });

    describe('single()', () => {

        it('should allow a single element', (done) => {

            const schema = Joi.array().items(Joi.number()).items(Joi.boolean().forbidden()).single();

            Helper.validate(schema, [
                [[1, 2, 3], true],
                [1, true],
                [['a'], false, null, {
                    message: '"value" at position 0 fails because ["0" must be a number]',
                    details: [{
                        message: '"0" must be a number',
                        path: [0],
                        type: 'number.base',
                        context: { label: 0, key: 0 }
                    }]
                }],
                ['a', false, null, {
                    message: 'single value of "value" fails because ["value" must be a number]',
                    details: [{
                        message: '"value" must be a number',
                        path: [],
                        type: 'number.base',
                        context: { label: 'value', key: undefined }
                    }]
                }],
                [true, false, null, {
                    message: 'single value of "value" contains an excluded value',
                    details: [{
                        message: 'single value of "value" contains an excluded value',
                        path: [],
                        type: 'array.excludesSingle',
                        context: { pos: 0, value: true, label: 'value', key: undefined }
                    }]
                }]
            ], done);
        });

        it('should allow a single element with multiple types', (done) => {

            const schema = Joi.array().items(Joi.number(), Joi.string()).single();

            Helper.validate(schema, [
                [[1, 2, 3], true],
                [1, true],
                [[1, 'a'], true],
                ['a', true],
                [true, false, null, {
                    message: 'single value of "value" does not match any of the allowed types',
                    details: [{
                        message: 'single value of "value" does not match any of the allowed types',
                        path: [],
                        type: 'array.includesSingle',
                        context: { pos: 0, value: true, label: 'value', key: undefined }
                    }]
                }]
            ], done);
        });

        it('should allow nested arrays', (done) => {

            const schema = Joi.array().items(Joi.array().items(Joi.number())).single();

            Helper.validate(schema, [
                [[[1], [2], [3]], true],
                [[1, 2, 3], true],
                [[['a']], false, null, {
                    message: '"value" at position 0 fails because ["0" at position 0 fails because ["0" must be a number]]',
                    details: [{
                        message: '"0" must be a number',
                        path: [0, 0],
                        type: 'number.base',
                        context: { label: 0, key: 0 }
                    }]
                }],
                [['a'], false, null, {
                    message: '"value" at position 0 fails because ["0" must be an array]',
                    details: [{
                        message: '"0" must be an array',
                        path: [0],
                        type: 'array.base',
                        context: { label: 0, key: 0 }
                    }]
                }],
                ['a', false, null, {
                    message: 'single value of "value" fails because ["value" must be an array]',
                    details: [{
                        message: '"value" must be an array',
                        path: [],
                        type: 'array.base',
                        context: { label: 'value', key: undefined }
                    }]
                }],
                [1, false, null, {
                    message: 'single value of "value" fails because ["value" must be an array]',
                    details: [{
                        message: '"value" must be an array',
                        path: [],
                        type: 'array.base',
                        context: { label: 'value', key: undefined }
                    }]
                }],
                [true, false, null, {
                    message: 'single value of "value" fails because ["value" must be an array]',
                    details: [{
                        message: '"value" must be an array',
                        path: [],
                        type: 'array.base',
                        context: { label: 'value', key: undefined }
                    }]
                }]
            ], done);
        });

        it('should allow nested arrays with multiple types', (done) => {

            const schema = Joi.array().items(Joi.array().items(Joi.number(), Joi.boolean())).single();

            Helper.validate(schema, [
                [[[1, true]], true],
                [[1, true], true],
                [[[1, 'a']], false, null, {
                    message: '"value" at position 0 fails because ["0" at position 1 does not match any of the allowed types]',
                    details: [{
                        message: '"0" at position 1 does not match any of the allowed types',
                        path: [0, 1],
                        type: 'array.includes',
                        context: { pos: 1, value: 'a', label: 0, key: 1 }
                    }]
                }],
                [[1, 'a'], false, null, {
                    message: '"value" at position 0 fails because ["0" must be an array]',
                    details: [{
                        message: '"0" must be an array',
                        path: [0],
                        type: 'array.base',
                        context: { label: 0, key: 0 }
                    }]
                }]
            ], done);
        });

        it('switches the single flag with explicit value', (done) => {

            const schema = Joi.array().single(true);
            const desc = schema.describe();
            expect(desc).to.equal({
                type: 'array',
                flags: { sparse: false, single: true }
            });
            done();
        });

        it('switches the single flag back', (done) => {

            const schema = Joi.array().single().single(false);
            const desc = schema.describe();
            expect(desc).to.equal({
                type: 'array',
                flags: { sparse: false, single: false }
            });
            done();
        });

        it('avoids unnecessary cloning when called twice', (done) => {

            const schema = Joi.array().single();
            expect(schema.single()).to.shallow.equal(schema);
            done();
        });
    });

    describe('options()', () => {

        it('respects stripUnknown', (done) => {

            const schema = Joi.array().items(Joi.string()).options({ stripUnknown: true });
            schema.validate(['one', 'two', 3, 4, true, false], (err, value) => {

                expect(err).to.not.exist();
                expect(value).to.equal(['one', 'two']);
                done();
            });
        });

        it('respects stripUnknown (as an object)', (done) => {

            const schema = Joi.array().items(Joi.string()).options({ stripUnknown: { arrays: true, objects: false } });
            schema.validate(['one', 'two', 3, 4, true, false], (err, value) => {

                expect(err).to.not.exist();
                expect(value).to.equal(['one', 'two']);
                done();
            });
        });
    });

    describe('ordered()', () => {

        it('shows path to errors in array ordered items', (done) => {

            expect(() => {

                Joi.array().ordered({
                    a: {
                        b: {
                            c: {
                                d: undefined
                            }
                        }
                    }
                });
            }).to.throw(Error, 'Invalid schema content: (0.a.b.c.d)');

            expect(() => {

                Joi.array().ordered({ foo: 'bar' }, undefined);
            }).to.throw(Error, 'Invalid schema content: (1)');

            done();
        });

        it('validates input against items in order', (done) => {

            const schema = Joi.array().ordered([Joi.string().required(), Joi.number().required()]);
            const input = ['s1', 2];
            schema.validate(input, (err, value) => {

                expect(err).to.not.exist();
                expect(value).to.equal(['s1', 2]);
                done();
            });
        });

        it('validates input with optional item', (done) => {

            const schema = Joi.array().ordered([Joi.string().required(), Joi.number().required(), Joi.number()]);
            const input = ['s1', 2, 3];

            schema.validate(input, (err, value) => {

                expect(err).to.not.exist();
                expect(value).to.equal(['s1', 2, 3]);
                done();
            });
        });

        it('validates input without optional item', (done) => {

            const schema = Joi.array().ordered([Joi.string().required(), Joi.number().required(), Joi.number()]);
            const input = ['s1', 2];

            schema.validate(input, (err, value) => {

                expect(err).to.not.exist();
                expect(value).to.equal(['s1', 2]);
                done();
            });
        });

        it('validates input without optional item', (done) => {

            const schema = Joi.array().ordered([Joi.string().required(), Joi.number().required(), Joi.number()]).sparse(true);
            const input = ['s1', 2, undefined];

            schema.validate(input, (err, value) => {

                expect(err).to.not.exist();
                expect(value).to.equal(['s1', 2, undefined]);
                done();
            });
        });

        it('validates input without optional item in a sparse array', (done) => {

            const schema = Joi.array().ordered([Joi.string().required(), Joi.number(), Joi.number().required()]).sparse(true);
            const input = ['s1', undefined, 3];

            schema.validate(input, (err, value) => {

                expect(err).to.not.exist();
                expect(value).to.equal(['s1', undefined, 3]);
                done();
            });
        });

        it('validates when input matches ordered items and matches regular items', (done) => {

            const schema = Joi.array().ordered([Joi.string().required(), Joi.number().required()]).items(Joi.number());
            const input = ['s1', 2, 3, 4, 5];
            schema.validate(input, (err, value) => {

                expect(err).to.not.exist();
                expect(value).to.equal(['s1', 2, 3, 4, 5]);
                done();
            });
        });

        it('errors when input does not match ordered items', (done) => {

            const schema = Joi.array().ordered([Joi.number().required(), Joi.string().required()]);
            const input = ['s1', 2];
            schema.validate(input, (err, value) => {

                expect(err).to.be.an.error('"value" at position 0 fails because ["0" must be a number]');
                expect(err.details).to.equal([{
                    message: '"0" must be a number',
                    path: [0],
                    type: 'number.base',
                    context: { label: 0, key: 0 }
                }]);
                done();
            });
        });

        it('errors when input has more items than ordered items', (done) => {

            const schema = Joi.array().ordered([Joi.number().required(), Joi.string().required()]);
            const input = [1, 's2', 3];
            schema.validate(input, (err, value) => {

                expect(err).to.be.an.error('"value" at position 2 fails because array must contain at most 2 items');
                expect(err.details).to.equal([{
                    message: '"value" at position 2 fails because array must contain at most 2 items',
                    path: [2],
                    type: 'array.orderedLength',
                    context: { pos: 2, limit: 2, label: 'value', key: 2 }
                }]);
                done();
            });
        });

        it('errors when input has more items than ordered items with abortEarly = false', (done) => {

            const schema = Joi.array().ordered([Joi.string(), Joi.number()]).options({ abortEarly: false });
            const input = [1, 2, 3, 4, 5];
            schema.validate(input, (err, value) => {

                expect(err).to.be.an.error('"value" at position 0 fails because ["0" must be a string]. "value" at position 2 fails because array must contain at most 2 items. "value" at position 3 fails because array must contain at most 2 items. "value" at position 4 fails because array must contain at most 2 items');
                expect(err.details).to.have.length(4);
                expect(err.details).to.equal([
                    {
                        message: '"0" must be a string',
                        path: [0],
                        type: 'string.base',
                        context: { value: 1, label: 0, key: 0 }
                    },
                    {
                        message: '"value" at position 2 fails because array must contain at most 2 items',
                        path: [2],
                        type: 'array.orderedLength',
                        context: { pos: 2, limit: 2, label: 'value', key: 2 }
                    },
                    {
                        message: '"value" at position 3 fails because array must contain at most 2 items',
                        path: [3],
                        type: 'array.orderedLength',
                        context: { pos: 3, limit: 2, label: 'value', key: 3 }
                    },
                    {
                        message: '"value" at position 4 fails because array must contain at most 2 items',
                        path: [4],
                        type: 'array.orderedLength',
                        context: { pos: 4, limit: 2, label: 'value', key: 4 }
                    }
                ]);
                done();
            });
        });

        it('errors when input has less items than ordered items', (done) => {

            const schema = Joi.array().ordered([Joi.number().required(), Joi.string().required()]);
            const input = [1];
            schema.validate(input, (err, value) => {

                expect(err).to.be.an.error('"value" does not contain 1 required value(s)');
                expect(err.details).to.equal([{
                    message: '"value" does not contain 1 required value(s)',
                    path: [],
                    type: 'array.includesRequiredUnknowns',
                    context: { unknownMisses: 1, label: 'value', key: undefined }
                }]);
                done();
            });
        });

        it('errors when input matches ordered items but not matches regular items', (done) => {

            const schema = Joi.array().ordered([Joi.string().required(), Joi.number().required()]).items(Joi.number()).options({ abortEarly: false });
            const input = ['s1', 2, 3, 4, 's5'];
            schema.validate(input, (err, value) => {

                expect(err).to.be.an.error('"value" at position 4 fails because ["4" must be a number]');
                expect(err.details).to.equal([{
                    message: '"4" must be a number',
                    path: [4],
                    type: 'number.base',
                    context: { label: 4, key: 4 }
                }]);
                done();
            });
        });

        it('errors when input does not match ordered items but matches regular items', (done) => {

            const schema = Joi.array().ordered([Joi.string(), Joi.number()]).items(Joi.number()).options({ abortEarly: false });
            const input = [1, 2, 3, 4, 5];
            schema.validate(input, (err, value) => {

                expect(err).to.be.an.error('"value" at position 0 fails because ["0" must be a string]');
                expect(err.details).to.equal([{
                    message: '"0" must be a string',
                    path: [0],
                    type: 'string.base',
                    context: { value: 1, label: 0, key: 0 }
                }]);
                done();
            });
        });

        it('errors when input does not match ordered items not matches regular items', (done) => {

            const schema = Joi.array().ordered([Joi.string(), Joi.number()]).items(Joi.string()).options({ abortEarly: false });
            const input = [1, 2, 3, 4, 5];
            schema.validate(input, (err, value) => {

                expect(err).to.be.an.error('"value" at position 0 fails because ["0" must be a string]. "value" at position 2 fails because ["2" must be a string]. "value" at position 3 fails because ["3" must be a string]. "value" at position 4 fails because ["4" must be a string]');
                expect(err.details).to.have.length(4);
                expect(err.details).to.equal([
                    {
                        message: '"0" must be a string',
                        path: [0],
                        type: 'string.base',
                        context: { value: 1, label: 0, key: 0 }
                    },
                    {
                        message: '"2" must be a string',
                        path: [2],
                        type: 'string.base',
                        context: { value: 3, label: 2, key: 2 }
                    },
                    {
                        message: '"3" must be a string',
                        path: [3],
                        type: 'string.base',
                        context: { value: 4, label: 3, key: 3 }
                    },
                    {
                        message: '"4" must be a string',
                        path: [4],
                        type: 'string.base',
                        context: { value: 5, label: 4, key: 4 }
                    }
                ]);
                done();
            });
        });

        it('errors but continues when abortEarly is set to false', (done) => {

            const schema = Joi.array().ordered([Joi.number().required(), Joi.string().required()]).options({ abortEarly: false });
            const input = ['s1', 2];
            schema.validate(input, (err, value) => {

                expect(err).to.be.an.error('"value" at position 0 fails because ["0" must be a number]. "value" at position 1 fails because ["1" must be a string]');
                expect(err.details).to.have.length(2);
                expect(err.details).to.equal([
                    {
                        message: '"0" must be a number',
                        path: [0],
                        type: 'number.base',
                        context: { label: 0, key: 0 }
                    },
                    {
                        message: '"1" must be a string',
                        path: [1],
                        type: 'string.base',
                        context: { value: 2, label: 1, key: 1 }
                    }
                ]);
                done();
            });
        });

        it('strips item', (done) => {

            const schema = Joi.array().ordered([Joi.string().required(), Joi.number().strip(), Joi.number().required()]);
            const input = ['s1', 2, 3];
            schema.validate(input, (err, value) => {

                expect(err).to.not.exist();
                expect(value).to.equal(['s1', 3]);
                done();
            });
        });

        it('strips multiple items', (done) => {

            const schema = Joi.array().ordered([Joi.string().strip(), Joi.number(), Joi.number().strip()]);
            const input = ['s1', 2, 3];
            schema.validate(input, (err, value) => {

                expect(err).to.not.exist();
                expect(value).to.equal([2]);
                done();
            });
        });
    });
});
