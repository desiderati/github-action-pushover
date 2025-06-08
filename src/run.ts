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
import * as core from '@actions/core';
import * as github from '@actions/github';
import got from 'got';

export async function run(
  innerCore: typeof core,
  innerGithub: typeof github,
  innerGot: typeof got,
): Promise<void> {
  try {
    const jobStatus = innerCore.getInput('job-status', {
      required: true,
    });
    const pushoverApiToken = innerCore.getInput('pushover-api-token', {
      required: true,
    });
    const pushoverUserKey = innerCore.getInput('pushover-user-key', {
      required: true,
    });

    const repositoryName = innerGithub.context.payload.repository
      ? innerGithub.context.payload.repository.full_name
      : 'Unknown Repository Name';
    const messageTitle = 'Repository: ' + repositoryName;
    const messageDescription = 'Job Status: ' + jobStatus;

    innerCore.info('Pushing notification to Pushover App...');
    const { statusCode, body } = await innerGot.post(
      `https://api.pushover.net/1/messages.json?token=${pushoverApiToken}&user=${pushoverUserKey}&title=${messageTitle}&message=${messageDescription}`,
    );

    innerCore.info('Notification pushed with success!');
    innerCore.setOutput('statusCode', statusCode);
    innerCore.setOutput('body', body);
  } catch (error) {
    innerCore.setFailed(
      `Error while pushing notification to Pushover App! Error: ${error.message}`,
    );
    throw error;
  }
}
