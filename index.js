var _ = require('lodash');
var URL = require('url');
var express = require('express');
var bodyParser = require('body-parser');


var app = module.exports = express();
app.use(bodyParser.json({strict: false}));

var authBehavior = 'echo';
var pageSize = 10;
var tickets = require('./tickets.json');

app.post('/_configure/auth-behavior', function (req, res) {
  authBehavior = req.body;
  console.log('Setting authBehavior', authBehavior);
  res.sendStatus(204);
});

app.post('/_configure/page-size', function (req, res) {
  pageSize = req.body;
  console.log('Setting pageSize', pageSize);
  res.sendStatus(204);
});

app.post('/_configure/tickets', function (req, res) {
  tickets = req.body;
  console.log('Setting tickets', tickets);
  res.sendStatus(204);
});

app.get('/oauth/authorizations/new', function (req, res) {
  var state = req.query.state;
  console.log('Query is', req.query);
  if (authBehavior === 'echo') {
    console.log('echoing', req.query);
    res.json(_.pick(req, 'query'));
  } else if (authBehavior === 'redirect') {
    var parsedUrl = URL.parse(req.query.redirect_uri, true);
    parsedUrl.query.code = 'mock_zendesk_code';
    parsedUrl.query.state = state;
    var redirectUri = URL.format(parsedUrl);
    console.log('Redirecting to', redirectUri);
    res.redirect(redirectUri);
  } else {
    res.json({authorized: false});
  }
});

app.post('/oauth/tokens', function (req, res) {
  var token = {
    access_token: 'mock_zendesk_token',
    token_type: 'bearer',
    scope: 'read'
  };

  console.log('Returning token', token);
  res.json(token);
});

app.get('/api/v2/incremental/tickets.json', function (req, res) {
  var startTime = req.query.start_time;
  var filteredTickets = tickets.map(function (ticket) {
    return ticket.ticket.generated_timestamp > startTime ?
      ticket.ticket : null;
  }).filter(Boolean);

  var pageOfTickets = _.sortBy(filteredTickets, 'generated_timestamp').
    slice(0, pageSize);
  console.log('Returning', pageOfTickets.length, 'since', startTime);
  res.json({
    count: filteredTickets.length,
    tickets: pageOfTickets,
    end_time: _.get(_.last(pageOfTickets), 'generated_timestamp')
  });
});

app.get('/api/v2/tickets/:ticketId/comments.json', function (req, res) {
  var ticketId = req.params.ticketId;
  var ticket = _.find(tickets, {id: Number(ticketId)});
  console.log('Found', ticket && ticket.comments.length, 'comments for', ticketId);
  res.json(_.pick(ticket, 'comments') || {comments: []});
});

app.use(function (req, res, next) {
  console.log('received', req);
  next();
});

var port = process.env.PORT || 3100;
app.listen(port);
console.log('Listening on', port);
