# mls server 

This is a NodeJS API that supports username and password authentication with JWTs and has APIs that return Chuck Norris phrases. How awesome is that?

## post test
curl --data "username=gonto&password=gonto" http://localhost:4001/sessions/createToken

## post json data
curl -H "Content-Type: application/json" -X POST -d '{"wxUsername":"test"}' http://localhost:4001/api/login