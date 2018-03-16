The scripts in this directory will provide test data to elasticsearch to use in conjunction
with this plugin.

The scripts will continuously send logging data to the test index in the same format that logstash
sends. The difference is that there will be an additional requestId field and svc field. Most
of the data will be random in nature, however the traversal path of a request will follow the
service path(s) dictated below.


1. ui-1, ui-2
2. login-1, login-2
3. ui-1, ui-2
4. catalog-1, catalog-2 (search)
5. inventory-1, inventory-2 (get)
6. ... ?

So a series of requests might look like:

1: 
  request....
  requestId: uuid1
  svc: ui-1
  
2: 
  request ...
  requestId: uuid1
  svc: login-2
  
3:
  request ...
  requestId: uuid1
  svc: ui-1
  
4: 
  request ...
  requestId: uuid1
  svc: catalog1
  
5:
  request ...
  requestId: uuid1
  svc: ui-1
 
6: (parallel requests)
  request ...
  requestId: uuid1
  svc: inventory-1

  request ...
  requestId: uuid1
  svc: inventory-2

  request ...
  requestId: uuid1
  svc: inventory-1
