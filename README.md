Modit Sails Example
===================

This is a simple chat application based on [Sails.js](http://sailsjs.org/). Socket.io and Angular allows for realtime chat between users. 

You can find a live example on an AWS instance [HERE](http://ec2-54-172-189-196.compute-1.amazonaws.com/){:target="_blank"}.

Install it:

```shell
fig build
fig up
```
This application uses Redis for session storage and Postgres for DB. All client side dependencies are installed during install

<!-- Core adapter logos -->
<a target="_blank" href="http://www.postgresql.org/"><img width="50" title="PostgreSQL" src="http://i.imgur.com/OSlDDKv.png"/></a>&nbsp; &nbsp; &nbsp; &nbsp;
<a target="_blank" href="http://redis.io/"><img width="75" title="Redis" src="http://i.imgur.com/dozv0ub.jpg"/></a>&nbsp; &nbsp; &nbsp; &nbsp;
<!-- /core adapter logos -->
#Folder Structure #

```

├── api 								-- server-side 
│   ├── controllers 
│   ├── models 
│   ├── policies 
│   ├── responses 
│   └── services 
├── assets							-- client-side 
│   ├── js 
│   ├── js							
├   	|── dependencies 
		| app.js 					-- All custom JS code here
│   └── styles 
├── config							-- SailsJS Configuration 
│   
├── node_modules 
│   
├── tasks							    -- Grunt Tasks 
│   ├── config 
│   └── register 					
├── views 								-- Custome views 
│   ├── register
│   ├── site
│   └layouts 

	
```

