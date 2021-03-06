'use strict'

const Joi = require('@hapi/joi')
const { BaseJsonService, NotFound } = require('..')

const latestBuildSchema = Joi.object({
  count: Joi.number().required(),
  value: Joi.array()
    .items(
      Joi.object({
        id: Joi.number().required(),
      })
    )
    .required(),
}).required()

const latestReleaseSchema = Joi.object({
  count: Joi.number().required(),
  value: Joi.array()
    .items(
      Joi.object({
        release: Joi.object({
          id: Joi.number().required(),
          artifacts: Joi.array().items(
            Joi.object({
              definitionReference: Joi.object({
                version: Joi.object({
                  name: Joi.string().required(),
                }),
              }),
            }).required()
          ),
        }),
        releaseEnvironment: Joi.object({
          name: Joi.string().required(),
        }),
        deploymentStatus: Joi.string().required(),
      })
    )
    .required(),
}).required()

module.exports = class AzureDevOpsBase extends BaseJsonService {
  static get auth() {
    return {
      passKey: 'azure_devops_token',
      defaultToEmptyStringForUser: true,
    }
  }

  async fetch({ url, options, schema, errorMessages }) {
    return this._requestJson({
      schema,
      url,
      options,
      errorMessages,
    })
  }

  async getLatestCompletedBuildId(
    organization,
    project,
    definitionId,
    branch,
    auth,
    errorMessages
  ) {
    // Microsoft documentation: https://docs.microsoft.com/en-us/rest/api/azure/devops/build/builds/list?view=azure-devops-rest-5.0
    const url = `https://dev.azure.com/${organization}/${project}/_apis/build/builds`
    const options = {
      qs: {
        definitions: definitionId,
        $top: 1,
        statusFilter: 'completed',
        'api-version': '5.0-preview.4',
      },
      auth,
    }

    if (branch) {
      options.qs.branchName = `refs/heads/${branch}`
    }

    const json = await this.fetch({
      url,
      options,
      schema: latestBuildSchema,
      errorMessages,
    })

    if (json.count !== 1) {
      throw new NotFound({ prettyMessage: 'build pipeline not found' })
    }

    return json.value[0].id
  }

  async getLatestCompletedBuildInfo(
    organization,
    project,
    definitionId,
    branch,
    auth,
    errorMessages
  ) {
    // Microsoft documentation: https://docs.microsoft.com/en-us/rest/api/azure/devops/build/builds/list?view=azure-devops-rest-5.0
    const url = `https://dev.azure.com/${organization}/${project}/_apis/build/builds`
    const options = {
      qs: {
        definitions: definitionId,
        $top: 1,
        statusFilter: 'completed',
        'api-version': '5.0-preview.4',
      },
      auth,
    }

    if (branch) {
      options.qs.branchName = `refs/heads/${branch}`
    }

    const json = await this.fetch({
      url,
      options,
      schema: latestBuildSchema,
      errorMessages,
    })

    if (json.count !== 1) {
      throw new NotFound({ prettyMessage: 'build pipeline not found' })
    }

    return json.value[0]
  }

  async getLatestCompletedReleaseInfo(
    organization,
    project,
    definitionId,
    definitionEnvironmentId,
    auth,
    errorMessages
  ) {
    // Microsoft documentation: https://docs.microsoft.com/en-us/rest/api/azure/devops/build/builds/list?view=azure-devops-rest-5.0
    const url = `https://vsrm.dev.azure.com/${organization}/${project}/_apis/release/deployments`
    const options = {
      qs: {
        definitionId,
        $top: 1,
        definitionEnvironmentId,
        'api-version': '5.0',
      },
      auth,
    }

    //if (branch) {
    //  options.qs.sourceBranch = `refs/heads/${branch}`
    //}

    const json = await this.fetch({
      url,
      options,
      schema: latestReleaseSchema,
      errorMessages,
    })

    if (json.count !== 1) {
      throw new NotFound({ prettyMessage: 'release pipeline not found' })
    }

    return json.value[0]
  }
}
