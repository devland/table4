All intructions defined here are valid for Arch Linux.
Edit `/etc/couchdb/local.ini` as follows.  
Create an admin account. It will be hashed on the next service start.  
```
[admins]
admin = <password_goes_here>
```
Enable proxy authentication handler.  
```
[chttpd]
authentication_handlers = {chttpd_auth, cookie_authentication_handler}, {couch_httpd_auth, proxy_authentication_handler}
```
Start the service via `systemctl start couchdb`. To stop it run `systemctl stop couchdb`.  
To enable it as a system service (it will start automatically when the system starts) run `systemctl enable couchdb`. To disable it as a system service run `systemctl disable couchdb`.
