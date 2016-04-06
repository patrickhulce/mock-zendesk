# mock-zendesk
Mocking Zendesk API

## Usage

### Configuration

Determine the behavior of `/oauth/authorizations/new`. Valid options are `echo` and `redirect`.
```
curl -X POST http://localhost:3100/_configure/auth-behavior --data '"redirect"'
```

Determine the paging behavior of `/api/v2/incremental/tickets.json`. Determines the number of tickets per page
```
curl -X POST http://localhost:3100/_configure/page-size --data '20'
```

Determine the tickets returned by `/api/v2/incremental/tickets.json` and `/api/v2/tickets/:ticketId/comments.json`. Uses `tickets.json` by default.
```
curl -X POST http://localhost:3100/_configure/tickets --data '[{}, {}]'
```
