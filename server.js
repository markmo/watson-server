'use strict';

const bodyParser = require('body-parser')
const env = require('node-env-file')
const express = require('express')
const moment = require('moment')
const watson = require('watson-developer-cloud')
const swaggerJSDoc = require('swagger-jsdoc')

const options = {
  swaggerDefinition: {
    info: {
      title: 'watson-server',
      version: '1.0.0'
    },
    basePath: '/watson-server'
  },
  apis: ['./server.js']
}

const swaggerSpec = swaggerJSDoc(options)

env(__dirname + '/.env')
const PORT = 8080
const DEFAULT_USERNAME = process.env.WATSON_USERNAME
const DEFAULT_PASSWORD = process.env.WATSON_PASSWORD
const DEFAULT_WORKSPACE_ID = process.env.WATSON_WORKSPACE_ID

let workspaceId = DEFAULT_WORKSPACE_ID

let conv = watson.conversation({
  username: DEFAULT_USERNAME,
  password: DEFAULT_PASSWORD,
  version: 'v1',
  version_date: '2017-02-03'
})

const app = express()
app.use(bodyParser.urlencoded({ extended: false, limit: '50mb' }))
app.use(bodyParser.json({ limit: '50mb' }))
app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
  next()
})
app.get('/', function (req, res) {
  res.send('Watson Proxy Server v1.0')
})
app.get('/api-docs.json', function (req, res) {
  res.setHeader('Content-Type', 'application/json')
  res.send(swaggerSpec)
})

/**
 * @swagger
 * definitions:
 *   ExampleResponse:
 *     type: object
 *     properties:
 *       created:
 *         type: string
 *         description: The timestamp for creation of the example.
 *       updated:
 *         type: string
 *         description: The timestamp for the last update to the example.
 *       text:
 *         type: string
 *         description: The text of the example.
 *
 *   IntentExportResponse:
 *     type: object
 *     properties:
 *       intent:
 *         type: string
 *         description: The name of the intent.
 *       description:
 *         type: string
 *         description: The description of the intent.
 *       created:
 *         type: string
 *         description: The timestamp for creation of the intent.
 *       updated:
 *         type: string
 *         description: The timestamp for the last update to the intent.
 *       examples:
 *         type: array
 *         items:
 *           $ref: '#/definitions/ExampleResponse'
 *         description: An array of ExampleResponse objects describing the user input examples for the intent.
 *
 *   IntentsResponse:
 *     type: object
 *     properties:
 *      intents:
 *        type: array
 *        items:
 *          $ref: '#/definitions/IntentExportResponse'
 *
 *   Error:
 *     type: object
 *     properties:
 *       status:
 *         type: integer
 *       message:
 *         type: string
 *
 * /intents:
 *   get:
 *     description: Get the list of intents for a Watson Conversation workspace.
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: Successful request
 *         schema:
 *           $ref: '#/definitions/IntentsResponse'
 *       500:
 *         description: Error fetching intents from Watson Conversation
 *         schema:
 *           $ref: '#/definitions/Error'
 */
app.get('/intents', function (req, res) {
  const data = {
    workspace_id: workspaceId
  }
  conv.getIntents(data, (err, resp) => {
    if (err) {
      console.error('Error fetching intents;', err)
      res.status(500).json({
        status: 500,
        message: 'Error fetching intents'
      })
    } else {
      res.json(resp)
    }
  })
})

/**
 * @swagger
 * definitions:
 *   IntentNew:
 *     type: object
 *     required:
 *       - name
 *       - utterances
 *     properties:
 *       name:
 *         type: string
 *       utterances:
 *         type: array
 *         items:
 *           type: string
 *
 *   NewIntentResponse:
 *     type: object
 *     properties:
 *       intent:
 *         type: string
 *         description: The name of the intent.
 *       description:
 *         type: string
 *         description: The description of the intent.
 *       created:
 *         type: string
 *         description: The timestamp for creation of the intent.
 *       updated:
 *         type: string
 *         description: The timestamp for the last update to the intent.
 *
 *   Error:
 *     type: object
 *     properties:
 *       status:
 *         type: integer
 *       message:
 *         type: string
 *
 * /intents:
 *   post:
 *     description: Deploy an intent to a Watson Conversation workspace.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: newIntentObject
 *         description: New intent payload
 *         in: body
 *         required: true
 *         type: object
 *         schema:
 *           $ref: '#/definitions/IntentNew'
 *     responses:
 *       200:
 *         description: Successful request
 *         schema:
 *           $ref: '#/definitions/NewIntentResponse'
 *       500:
 *         description: Error posting workspace to Watson Conversation
 *         schema:
 *           $ref: '#/definitions/Error'
 */
app.post('/intents', function (req, res) {
  console.log('received body:\n', req.body)
  const { name, utterances } = req.body
  console.log('workspace id:', WORKSPACE_ID)
  const now = moment(Date.now()).format()
  const data = {
    workspace_id: workspaceId,
    intent: name,
    description: null,
    created: now,
    updated: now,
    examples: utterances ? utterances.map((text) => {
      return {
        text,
        created: now,
        updated: now
      }
    }) : []
  }
  console.log('sending data:\n', JSON.stringify(data, null, 2))
  conv.createIntent(data, (err, resp) => {
    if (err) {
      console.error('Error posting intent;', err)
      res.status(500).json({
        status: 500,
        message: 'Error posting intent'
      })
    } else {
      res.json({ status: 'OK' })
    }
  })
})

/**
 * @swagger
 * definitions:
 *   IntentUpdate:
 *     type: object
 *     required:
 *       - name
 *       - old_name
 *       - utterances
 *     properties:
 *       name:
 *         type: string
 *       old_name:
 *         type: string
 *       utterances:
 *         type: array
 *         items:
 *           type: string
 *
 *   ExampleResponse:
 *     type: object
 *     properties:
 *       created:
 *         type: string
 *         description: The timestamp for creation of the example.
 *       updated:
 *         type: string
 *         description: The timestamp for the last update to the example.
 *       text:
 *         type: string
 *         description: The text of the example.
 *
 *   GetIntentResponse:
 *     type: object
 *     properties:
 *       intent:
 *         type: string
 *         description: The name of the intent.
 *       description:
 *         type: string
 *         description: The description of the intent.
 *       created:
 *         type: string
 *         description: The timestamp for creation of the intent.
 *       updated:
 *         type: string
 *         description: The timestamp for the last update to the intent.
 *       examples:
 *         type: array
 *         items:
 *           $ref: '#/definitions/ExampleResponse'
 *         description: An array of ExampleResponse objects describing the user input examples for the intent.
 *
 *   Error:
 *     type: object
 *     properties:
 *       status:
 *         type: integer
 *       message:
 *         type: string
 *
 * /intents/{intentId}:
 *   post:
 *     description: Update an intent to a Watson Conversation workspace.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: intentId
 *         description: id of intent to update
 *         in: path
 *         required: true
 *         type: string
 *       - name: updatedIntentObject
 *         description: Updated intent payload
 *         in: body
 *         required: true
 *         type: object
 *         schema:
 *           $ref: '#/definitions/IntentUpdate'
 *     responses:
 *       200:
 *         description: Successful request
 *         schema:
 *           $ref: '#/definitions/GetIntentResponse'
 *       500:
 *         description: Error posting workspace to Watson Conversation
 *         schema:
 *           $ref: '#/definitions/Error'
 */
app.post('/intents/:intentId', function (req, res) {
  console.log('received body:\n', req.body)
  const { name, old_name, utterances } = req.body
  console.log('workspace id:', WORKSPACE_ID)
  const now = moment(Date.now()).format()
  const oldName = old_name || name
  const data = {
    workspace_id: workspaceId,
    intent: oldName,
    old_intent: oldName,
    new_intent: {
      intent: name,
      description: null,
      updated: now,
      examples: utterances ? utterances.map((text) => {
        return {
          text,
          created: now,
          updated: now
        }
      }) : []
    }
  }
  console.log('sending data:\n', JSON.stringify(data, null, 2))
  conv.updateIntent(data, (err, resp) => {
    if (err) {
      console.error('Error updating intent;', err)
      res.status(500).json({
        status: 500,
        message: 'Error updating intent'
      })
    } else {
      res.json({ status: 'OK' })
    }
  })
})

/**
 * @swagger
 * definitions:
 *   WorkspaceResponse:
 *     type: object
 *     properties:
 *       name:
 *         type: string
 *         description: The name of the workspace.
 *       description:
 *         type: string
 *         description: The description of the workspace.
 *       language:
 *         type: string
 *         description: The language of the workspace.
 *       metadata:
 *         type: object
 *         description: Any metadata that is required by the workspace.
 *       created:
 *         type: string
 *         description: The timestamp for creation of the workspace.
 *       updated:
 *         type: string
 *         description: The timestamp for the last update to the workspace.
 *       workspace_id:
 *         type: string
 *         description: The workspace ID.
 *
 *   Error:
 *     type: object
 *     properties:
 *       status:
 *         type: integer
 *       message:
 *         type: string
 *
 * /workspaces:
 *   get:
 *     description: Get a list of workspaces from a Watson Conversation workspace.
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: Successful request
 *         type: array
 *         items:
 *           $ref: '#/definitions/WorkspaceResponse'
 *       500:
 *         description: Error fetching workspaces from Watson Conversation
 *         schema:
 *           $ref: '#/definitions/Error'
 */
app.get('/workspaces', function (req, res) {
  console.log('getting workspaces')
  conv.listWorkspaces(null, (err, resp) => {
    if (err) {
      console.error('Error getting workspaces;', err)
      res.status(500).json({
        status: 500,
        message: 'Error getting workspaces'
      })
    } else {
      res.json(resp)
    }
  })
})

/**
 * @swagger
 * definitions:
 *   ExampleNew:
 *     type: object
 *     required:
 *       - text
 *     properties:
 *       text:
 *         type: string
 *         description: The text of a user input example.
 *
 *   NodeOutputAction:
 *     type: object
 *     required:
 *       - name
 *     properties:
 *       name:
 *         type: string
 *       args:
 *         type: object
 *         additionalProperties:
 *           type: string
 *
 *   NodeOutputText:
 *     type: object
 *     required:
 *       - values
 *     properties:
 *       values:
 *         type: array
 *         items:
 *           type: string
 *       selection_policy:
 *         type: string
 *         enum:
 *           - random
 *           - sequential
 *       node_position:
 *         type: string
 *
 *   NodeOutputLayout:
 *     type: object
 *     required:
 *       - name
 *     properties:
 *       name:
 *         type: string
 *       data:
 *         type: string
 *
 *   NodeOutputInputValidation:
 *     type: object
 *     properties:
 *       typeOf:
 *         type: string
 *       oneOf:
 *         type: array
 *         items:
 *           type: string
 *
 *   NodeOutput:
 *     type: object
 *     properties:
 *       text:
 *         type:
 *           - string
 *           - object
 *         description: The output text of the dialog node.
 *         schema:
 *           $ref: '#/definitions/NodeOutputText'
 *       action:
 *         type: object
 *         schema:
 *           $ref: '#/definitions/NodeOutputAction'
 *       node_position:
 *         type: string
 *       layout:
 *         type: object
 *         schema:
 *           $ref: '#/definitions/NodeOutputLayout'
 *       inputvalidation:
 *         type: object
 *         schema:
 *           $ref: '#/definitions/NodeOutputInputValidation'
 *
 *   NodeGoto:
 *     type: object
 *     properties:
 *       dialog_node:
 *         type: string
 *         description: The ID of the dialog node to go to.
 *       selector:
 *         type: string
 *         description: Where in the target node focus is to be passed to.
 *
 *   NodeNew:
 *     type: object
 *     required:
 *       - dialog_node
 *     properties:
 *       dialog_node:
 *         type: string
 *         description: The dialog node ID.
 *       description:
 *         type: string
 *         description: The description of the dialog node.
 *       conditions:
 *         type: string
 *         description: The condition that will trigger the dialog node.
 *       parent:
 *         type: string
 *         description: The ID of the parent dialog node.
 *       previous_sibling:
 *         type: string
 *         description: The ID of the previous sibling dialog node.
 *       output:
 *         type: object
 *         description: The output from the dialog node.
 *         schema:
 *           $ref: '#/definitions/NodeOutput'
 *       context:
 *         type: object
 *         description: The context for the dialog node.
 *       metadata:
 *         type: object
 *         description: The metadata for the dialog node.
 *       go_to:
 *         type: object
 *         description: The location to go to when the dialog node is triggered.
 *         schema:
 *           $ref: '#/definitions/NodeGoto'
 *
 *   EntityValue:
 *     type: object
 *     required:
 *       - value
 *     properties:
 *       value:
 *         type: string
 *         description: The text of the entity value.
 *       metadata:
 *         type: object
 *         description: Any metadata related to the entity value.
 *       synonyms:
 *         type: array
 *         items:
 *           type: string
 *         description: An array containing any synonyms for the entity value.
 *
 *   EntityNew:
 *     type: object
 *     required:
 *       - entity
 *       - values
 *     properties:
 *       entity:
 *         type: string
 *         description: The name of the entity.
 *       description:
 *         type: string
 *         description: The description of the entity.
 *       metadata:
 *         type: object
 *         description: Any metadata related to the entity.
 *       values:
 *         type: array
 *         items:
 *           $ref: '#/definitions/EntityValue'
 *         description: An array of entity values.
 *       fuzzy_match:
 *         type: boolean
 *         description: Whether to use fuzzy matching for the entity.
 *
 *   IntentNew:
 *     type: object
 *     required:
 *       - intent
 *     properties:
 *       intent:
 *         type: string
 *         description: The name of the intent.
 *       description:
 *         type: string
 *         description: The description of the intent.
 *       examples:
 *         type: array
 *         items:
 *           $ref: '#/definitions/ExampleNew'
 *         description: An array of user input examples for the intent.
 *
 *   WorkspaceNew:
 *     type: object
 *     required:
 *       - name
 *       - dialog_nodes
 *       - entities
 *       - intents
 *     properties:
 *       name:
 *         type: string
 *         description: The name of the workspace.
 *       description:
 *         type: string
 *         description: The description of the workspace.
 *       language:
 *         type: string
 *         description: The language of the workspace.
 *       metadata:
 *         type: object
 *         description: Any metadata related to the workspace.
 *       counterexamples:
 *         type: array
 *         items:
 *           $ref: '#/definitions/ExampleNew'
 *         description: An array of ExampleNew objects defining input examples that have been marked as irrelevant input.
 *       dialog_nodes:
 *         type: array
 *         items:
 *           $ref: '#/definitions/NodeNew'
 *         description: An array of NodeNew objects defining the nodes in the workspace dialog.
 *       entities:
 *         type: array
 *         items:
 *           $ref: '#/definitions/EntityNew'
 *         description: An array of EntityNew objects defining the entities for the workspace.
 *       intents:
 *         type: array
 *         items:
 *           $ref: '#/definitions/IntentNew'
 *         description: An array of CreateIntent objects defining the intents for the workspace.
 *
 *   WorkspaceResponse:
 *     type: object
 *     properties:
 *       name:
 *         type: string
 *         description: The name of the workspace.
 *       description:
 *         type: string
 *         description: The description of the workspace.
 *       language:
 *         type: string
 *         description: The language of the workspace.
 *       metadata:
 *         type: object
 *         description: Any metadata that is required by the workspace.
 *       created:
 *         type: string
 *         description: The timestamp for creation of the workspace.
 *       updated:
 *         type: string
 *         description: The timestamp for the last update to the workspace.
 *       workspace_id:
 *         type: string
 *         description: The workspace ID.
 *
 *   Error:
 *     type: object
 *     properties:
 *       status:
 *         type: integer
 *       message:
 *         type: string
 *
 * /workspaces:
 *   post:
 *     description: Create a new workspace in Watson Conversation.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: workspace
 *         description: workspace payload
 *         in: body
 *         required: true
 *         type: object
 *         schema:
 *           $ref: '#/definitions/WorkspaceNew'
 *     responses:
 *       200:
 *         description: Successful request
 *         schema:
 *           $ref: '#/definitions/WorkspaceResponse'
 *       500:
 *         description: Error creating workspace
 *         schema:
 *           $ref: '#/definitions/Error'
 */
app.post('/workspaces', function (req, res) {
  const data = req.body
  console.log('creating workspace:', data.name)
  conv.createWorkspace(data, (err, resp) => {
    if (err) {
      console.error('Error creating workspace;', err)
      res.status(500).json({
        status: 500,
        message: 'Error creating workspace'
      })
    } else {
      res.json(resp)
    }
  })
})

/**
 * @swagger
 * definitions:
 *   NodeOutputAction:
 *     type: object
 *     properties:
 *       name:
 *         type: string
 *       args:
 *         type: object
 *         additionalProperties:
 *           type: string
 *
 *   NodeOutputText:
 *     type: object
 *     properties:
 *       values:
 *         type: array
 *         items:
 *           type: string
 *       selection_policy:
 *         type: string
 *         enum:
 *           - random
 *           - sequential
 *       node_position:
 *         type: string
 *
 *   NodeOutputLayout:
 *     type: object
 *     properties:
 *       name:
 *         type: string
 *       data:
 *         type: string
 *
 *   NodeOutputInputValidation:
 *     type: object
 *     properties:
 *       typeOf:
 *         type: string
 *       oneOf:
 *         type: array
 *         items:
 *           type: string
 *
 *   NodeOutput:
 *     type: object
 *     properties:
 *       text:
 *         type:
 *           - string
 *           - object
 *         description: The output text of the dialog node.
 *         schema:
 *           $ref: '#/definitions/NodeOutputText'
 *       action:
 *         type: object
 *         schema:
 *           $ref: '#/definitions/NodeOutputAction'
 *       node_position:
 *         type: string
 *       layout:
 *         type: object
 *         schema:
 *           $ref: '#/definitions/NodeOutputLayout'
 *       inputvalidation:
 *         type: object
 *         schema:
 *           $ref: '#/definitions/NodeOutputInputValidation'
 *
 *   NodeGoto:
 *     type: object
 *     properties:
 *       dialog_node:
 *         type: string
 *         description: The ID of the dialog node to go to.
 *       selector:
 *         type: string
 *         description: Where in the target node focus is to be passed to.
 *
 *   NodeResponse:
 *     type: object
 *     properties:
 *       dialog_node:
 *         type: string
 *         description: The dialog node ID.
 *       description:
 *         type: string
 *         description: The description of the dialog node.
 *       conditions:
 *         type: string
 *         description: The condition that will trigger the dialog node.
 *       parent:
 *         type: string
 *         description: The ID of the parent dialog node.
 *       previous_sibling:
 *         type: string
 *         description: The ID of the previous sibling dialog node.
 *       output:
 *         type: object
 *         description: The output from the dialog node.
 *         schema:
 *           $ref: '#/definitions/NodeOutput'
 *       context:
 *         type: object
 *         description: The context for the dialog node.
 *       metadata:
 *         type: object
 *         description: The metadata for the dialog node.
 *       go_to:
 *         type: object
 *         description: The location to go to when the dialog node is triggered.
 *         schema:
 *           $ref: '#/definitions/NodeGoto'
 *       created:
 *         type: string
 *         description: The timestamp for creation of the dialog node.
 *
 *   ExampleResponse:
 *     type: object
 *     properties:
 *       created:
 *         type: string
 *         description: The timestamp for creation of the example.
 *       updated:
 *         type: string
 *         description: The timestamp for the last update to the example.
 *       text:
 *         type: string
 *         description: The text of the example.
 *
 *   IntentExportResponse:
 *     type: object
 *     properties:
 *       intent:
 *         type: string
 *         description: The name of the intent.
 *       description:
 *         type: string
 *         description: The description of the intent.
 *       created:
 *         type: string
 *         description: The timestamp for creation of the intent.
 *       updated:
 *         type: string
 *         description: The timestamp for the last update to the intent.
 *       examples:
 *         type: array
 *         items: '#/definitions/ExampleResponse'
 *         description: An array of ExampleResponse objects describing the user input examples for the intent.
 *
 *   ValueExportResponse:
 *     type: object
 *     properties:
 *       value:
 *         type: string
 *         description: The text of the entity value.
 *       metadata:
 *         type: object
 *         description: Any metadata related to the entity value.
 *       created:
 *         type: string
 *         description: The timestamp for the creation of the entity value.
 *       updated:
 *         type: string
 *         description: The timestamp for the last update to the entity value.
 *       synonyms:
 *         type: array
 *         items:
 *           type: string
 *         description: An array containing any synonyms for the entity value.
 *
 *   EntityExportResponse:
 *     type: object
 *     properties:
 *       entity:
 *         type: string
 *         description: The name of the entity.
 *       description:
 *         type: string
 *         description: The description of the entity.
 *       type:
 *         type: string
 *         description: Reserved for future use.
 *       source:
 *         type: string
 *         description: The source of the entity. For system entities, system.entities is returned.
 *       created:
 *         type: string
 *         description: The timestamp for creation of the entity.
 *       updated:
 *         type: string
 *         description: The timestamp for the last update to the entity.
 *       values:
 *         type: array
 *         items:
 *           $ref: '#/definitions/ValueExportResponse'
 *         description: An array of ValueExportResponse objects describing the entity values.
 *       fuzzy_match:
 *         type: boolean
 *         description: Whether fuzzy matching is used for the entity.
 *
 *   Workspace:
 *     type: object
 *     properties:
 *       name:
 *         type: string
 *         description: The name of the workspace.
 *       description:
 *         type: string
 *         description: The description of the workspace.
 *       language:
 *         type: string
 *         description: The language of the workspace.
 *       metadata:
 *         type: object
 *         description: Any metadata that is required by the workspace.
 *       created:
 *         type: string
 *         description: The timestamp for creation of the workspace.
 *       updated:
 *         type: string
 *         description: The timestamp for the last update to the workspace.
 *       workspace_id:
 *         type: string
 *         description: The workspace ID.
 *       status:
 *         type: string
 *         enum:
 *           - Non Existent
 *           - Training
 *           - Failed
 *           - Available
 *           - Unavailable
 *         description: The current status of the workspace
 *       intents:
 *         type: array
 *         items:
 *           $ref: '#/definitions/IntentExportResponse'
 *         description: An array of IntentExportResponse objects describing the intents for the workspace.
 *       entities:
 *         type: array
 *         items:
 *           $ref: '#/definitions/EntityExportResponse'
 *         description: An array of EntityExportResponse objects describing the entities for the workspace.
 *       counterexamples:
 *         type: array
 *         items:
 *           $ref: '#/definitions/ExampleResponse'
 *         description: An array of ExampleResponse objects describing the user input examples that have been marked as irrelevant input.
 *       dialog_nodes:
 *         type: array
 *         items:
 *           $ref: '#/definitions/NodeResponse'
 *         description: An array of NodeResponse objects describing the dialog nodes for the workspace.
 *
 *   Error:
 *     type: object
 *     properties:
 *       status:
 *         type: integer
 *       message:
 *         type: string
 *
 * /workspaces/{workspaceId}:
 *   get:
 *     description: Get workspace details.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: workspaceId
 *         description: id of workspace
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Successful request
 *         schema:
 *           $ref: '#/definitions/Workspace'
 *       500:
 *         description: Error creating workspace
 *         schema:
 *           $ref: '#/definitions/Error'
 */
app.get('/workspaces/:workspaceId', function (req, res) {
  const workspace_id = req.params.workspaceId
  console.log('received request for workspace', workspace_id)
  conv.getWorkspace({ workspace_id, export: true }, (err, resp) => {
    if (err) {
      console.error('Error getting workspace;', err)
      res.status(500).json({
        status: 500,
        message: 'Error getting workspace'
      })
    } else {
      res.json(resp)
    }
  })
})

/**
 * @swagger
 * definitions:
 *   StatusResponse:
 *     type: object
 *     properties:
 *       status:
 *         type: string
 *
 * /workspace/{workspaceId}:
 *   post:
 *     description: Set the current workspace to use for subsequent requests.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: workspaceId
 *         description: id of workspace to set
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Successful request
 *         schema:
 *           $ref: '#/definitions/StatusResponse'
 *       500:
 *         description: Error creating workspace
 */
app.post('/workspace/:workspaceId', function (req, res) {
  console.log('set workspace id')
  workspaceId = req.params.workspaceId
  res.send({ status: 'OK' })
})

/**
 * @swagger
 * definitions:
 *   Config:
 *     type: object
 *     properties:
 *       username:
 *         type: string
 *       password:
 *         type: string
 *       workspaceId:
 *         type: string
 *
 * /config:
 *   post:
 *     description: Update the configuration of this proxy.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: configObject
 *         description: configuration object
 *         in: body
 *         required: true
 *         type: object
 *         schema:
 *           $ref: '#/definitions/Config'
 *     responses:
 *       200:
 *         description: Successful request
 *       500:
 *         description: Error updating config
 */
app.post('/config', function (req, res) {
  console.log('received config:\n', req.body)
  const { username, password, workspaceId: wid } = req.body
  workspaceId = wid || DEFAULT_WORKSPACE_ID
  conv = watson.conversation({
    username: username || DEFAULT_USERNAME,
    password: password || DEFAULT_PASSWORD,
    version: 'v1',
    version_date: '2017-02-03'
  })
  res.send({ status: 'OK' })
})

/**
 * @swagger
 * definitions:
 *   InputData:
 *     type: object
 *     required:
 *       - text
 *     properties:
 *       text:
 *         type: string
 *         description: The text of the user input.
 *
 *   Context:
 *     type: object
 *     properties:
 *       conversation_id:
 *         type: string
 *         description: The unique identifier of the conversation.
 *       system:
 *         type: string
 *         description: For internal use only.
 *
 *   RuntimeEntity:
 *     type: object
 *     properties:
 *       entity:
 *         type: string
 *         description: An entity detected in the input.
 *       location:
 *         type: array
 *         items:
 *           type: integer
 *         description: An array of zero-based character offsets that indicate where the detected entity values begin and end in the input text.
 *       value:
 *         type: string
 *         description: The term in the input that was recognized as an entity value.
 *       confidence:
 *         type: double
 *         description: A decimal percentage that represents Watson's confidence in the entity.
 *
 *   RuntimeIntent:
 *     type: object
 *     properties:
 *       intent:
 *         type: string
 *         description: The name of the recognized intent.
 *       confidence:
 *         type: double
 *         description: A decimal percentage that represents the confidence that Watson has in this intent. Higher values represent higher confidences.
 *
 *   LogMessageResponse:
 *     type: object
 *     properties:
 *       level:
 *         type: string
 *         enum:
 *           - info
 *           - warn
 *           - error
 *         description: The severity of the message.
 *       msg:
 *         type: string
 *         description: The text of the log message.
 *
 *   OutputData:
 *     type: object
 *     properties:
 *       text:
 *         type: array
 *         items:
 *           type: string
 *         description: An array of responses to the user. Returns an empty array if no responses are returned.
 *       log_messages:
 *         type: object
 *         schema:
 *           $ref: '#/definitions/LogMessageResponse'
 *         description: Up to 50 messages logged with the request. Returns an empty array if no messages are returned.
 *       nodes_visited:
 *         type: array
 *         items:
 *           type: string
 *         description: An array of the nodes that were triggered to create the response. This information is useful for debugging and for visualizing the path taken through the node tree.
 *
 *   MessageRequest:
 *     type: object
 *     required:
 *       - input
 *     properties:
 *       input:
 *         type: object
 *         schema:
 *           $ref: '#/definitions/InputData'
 *         description: The user input.
 *       alternate_inputs:
 *         type: boolean
 *         description: Whether to return more than one intent. Set to true to return all matching intents. For example, return all intents when the confidence is not high to allow users to choose their intent. The default value is false.
 *       context:
 *         type: object
 *         schema:
 *           $ref: '#/definitions/Context'
 *         description: State information for the conversation. To maintain state, include the Context object from the previous response when sending multiple requests for the same conversation.
 *       entities:
 *         type: array
 *         items:
 *           $ref: '#/definitions/RuntimeEntity'
 *         description: Entities to use when evaluating the message. Include entities from the previous response to continue using those entities rather than detecting entities in the new input.
 *       intents:
 *         type: array
 *         items:
 *           $ref: '#/definitions/RuntimeIntent'
 *         description: Intents to use when evaluating the user input. Include the intents from the previous response to continue using those intents rather than trying to recognize intents in the new input.
 *       output:
 *         type: object
 *         schema:
 *           $ref: '#/definitions/OutputData'
 *         description: System output. Include the output from the previous response to maintain intermediate informationif you have several requests within the same dialog turn.
 *
 *   MessageInput:
 *     type: object
 *     required:
 *       - text
 *     properties:
 *       text:
 *         type: string
 *         description: The text of the user input.
 *
 *   MessageResponse:
 *     type: object
 *     description: Returns the last user input, the recognized intents and entities, and the updated context and system output. The response can include properties that are added by dialog node output or by the client app.
 *     properties:
 *       input:
 *         type: object
 *         schema:
 *           $ref: '#/definitions/MessageInput'
 *         description: The user input from the request.
 *       intents:
 *         type: array
 *         items:
 *           $ref: '#/definitions/RuntimeIntent'
 *         description: An array of intents recognized in the user input, sorted in descending order of confidence. Returns an empty array if no intents are recognized.
 *       entities:
 *         type: array
 *         items:
 *           $ref: '#/definitions/RuntimeEntity'
 *         description: An array of entities identified in the user input. Returns an empty array if no entities are identified.
 *       alternate_inputs:
 *         type: boolean
 *         description: Whether to return more than one intent. Included in the response only when sent with the request.
 *       context:
 *         type: object
 *         schema:
 *           $ref: '#/definitions/Context'
 *         description: State information for the conversation.
 *       output:
 *         type: object
 *         schema:
 *           $ref: '#/definitions/OutputData'
 *         description: Output from the dialog, including the response to the user, the nodes that were triggered, and log messages.
 *
 * /api/message:
 *   post:
 *     description: Send a message to Watson Conversation.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: message
 *         description: message payload
 *         in: body
 *         required: true
 *         type: object
 *         schema:
 *           $ref: '#/definitions/MessageRequest'
 *     responses:
 *       200:
 *         description: Successful request
 *         schema:
 *           $ref: '#/definitions/MessageResponse'
 *       400:
 *         description: Invalid request
 *       404:
 *         description: The request specified a resource that was not found
 */
app.post('/api/message', function (req, res) {
  const payload = {
    workspace_id: workspaceId,
    context: req.body.context || {},
    input: req.body.input || {}
  }
  conv.message(payload, (err, data) => {
    if (err) {
      return res.status(err.code || 500).json(err)
    }
    return res.json(updateMessage(payload, data))
  })
})

/**
 * Updates the response text using the intent confidence
 * @param  {Object} input The request to the Conversation service
 * @param  {Object} response The response from the Conversation service
 * @return {Object}          The response with the updated message
 */
function updateMessage(input, response) {
  var responseText = null
  if (!response.output) {
    response.output = {}
  } else {
    return response
  }
  if (response.intents && response.intents[0]) {
    var intent = response.intents[0]
    // Depending on the confidence of the response the app can return different
    // messages. The confidence will vary depending on how well the system is
    // trained. The service will always try to assign a class/intent to the
    // input. If the confidence is low, then it suggests the service is unsure
    // of the user's intent. In these cases it is usually best to return a
    // disambiguation message
    // ('I did not understand your intent, please rephrase your question', etc.)
    if (intent.confidence >= 0.75) {
      responseText = 'I understood your intent was ' + intent.intent
    } else if (intent.confidence >= 0.5) {
      responseText = 'I think your intent was ' + intent.intent
    } else {
      responseText = 'I did not understand your intent'
    }
  }
  response.output.text = responseText
  return response
}

app.listen(PORT)
console.log('Watson proxy server running on port :' + PORT)
