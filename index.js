var _ = require('lodash');
var express = require('express');
var bodyParser = require('body-parser');

var app = module.exports = express();
app.use(bodyParser.json({strict: false}));

var authBehavior = 'echo';
var pageSize = 10;
var tickets = require('./tickets.json');

app.post('/_configure/auth-behavior', function (req, res) {
  approveNext = req.body;
  console.log('Setting approveNext', approveNext);
});

app.post('/_configure/page-size', function (req, res) {
  pageSize = req.body;
  console.log('Setting pageSize', pageSize);
});

app.post('/_configure/tickets', function (req, res) {
  tickets = req.body;
  console.log('Setting tickets', tickets);
});

app.get('/oauth/authorizations/new', function (req, res) {
  var state = req.query.state;
  console.log('Query is', req.query);
  if (authBehavior === 'echo') {
    console.log('echoing', req.query);
    res.json(_.pick(req, 'query'));
  } else if (authBehavior === 'redirect') {
    var redirectUri = req.query.redirect_uri + '?code=12345678&state=' +
      encodeURIComponent(state);
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
    return ticket.ticket.generated_timestamp >= startTime ?
      ticket.ticket : null;
  }).filter(Boolean);

  var pageOfTickets = _.sortBy(filteredTickets, 'generated_timestamp').
    slice(0, pageSize);

  res.json({
    count: filteredTickets.length,
    tickets: pageOfTickets,
    end_time: _.get(pageOfTickets, '0.generated_timestamp')
  });
});

app.get('/api/v2/tickets/:ticketId/comments.json', function (req, res) {
  var ticketId = req.params.ticketId;
  var ticket = _.find(tickets, {id: ticketId});
  res.json(_.pick(ticket, 'comments') || {comments: []});
});

app.use(function (req, res, next) {
  console.log('received', req);
  next();
});

var port = process.env.PORT || 3100;
app.listen(port);
console.log('Listening on', port);
