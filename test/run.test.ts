/*
 * Copyright (c) 2025 - Felipe Desiderati
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
 * associated documentation files (the "Software"), to deal in the Software without restriction,
 * including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial
 * portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT
 * LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
import { assert } from 'chai';
import sinon from 'sinon';
import * as core from '@actions/core';
import * as github from '@actions/github';
import got from 'got';
import { run } from '../src/run';

function createCore() {
  const getInput = sinon.stub();
  getInput.withArgs('job-status', { required: true }).returns('job-status');

  getInput
    .withArgs('pushover-api-token', { required: true })
    .returns('pushover-api-token');

  getInput
    .withArgs('pushover-user-key', { required: true })
    .returns('pushover-user-key');

  return {
    getInput,
    info: sinon.fake(),
    setOutput: sinon.fake(),
    setFailed: sinon.fake(),
  };
}

function createGithub() {
  return {
    context: {
      payload: sinon.fake(),
    },
  };
}

function createGot() {
  return {
    post: sinon.fake.resolves({
      statusCode: 200,
      body: 'Just a simple test!',
    }),
  };
}

function doRun(
  innerCore = createCore(),
  innerGithub = createGithub(),
  innerGot = createGot(),
) {
  return run(
    (innerCore as unknown) as typeof core,
    (innerGithub as unknown) as typeof github,
    (innerGot as unknown) as typeof got,
  );
}

suite('run', function () {
  test('Calls correct pushover webhook URL', async function () {
    const core = createCore();
    const github = createGithub();
    const got = createGot();
    await doRun(core, github, got);

    sinon.assert.calledWith(
      got.post,
      'https://api.pushover.net/1/messages.json?token=pushover-api-token&user=pushover-user-key&title=Repository: Unknown Repository Name&message=Job Status: job-status',
    );
  });

  test('Returns status code and body', async function () {
    const core = createCore();
    const github = createGithub();
    const got = createGot();
    await doRun(core, github, got);

    sinon.assert.calledWith(core.setOutput, 'statusCode', 200);
    sinon.assert.calledWith(core.setOutput, 'body', 'Just a simple test!');
  });

  test('Calls setFailed() when an error occurred', async function () {
    const core = createCore();
    const github = createGithub();
    const got = {
      post: sinon.fake.throws(new Error('Test error')),
    };

    try {
      await doRun(core, github, got);
      assert.fail();
    } catch {
      sinon.assert.calledWith(
        core.setFailed,
        'Error while pushing notification to Pushover App! Error: Test error',
      );
    }
  });
});
