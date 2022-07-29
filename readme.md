All intructions defined here are valid for Arch Linux.

1. Edit `/etc/couchdb/local.ini` as follows.  
Create an admin account. It will be hashed on the next service start.  
```
[admins]
admin = <password_goes_here>
```
2. Enable proxy authentication handler.  
```
[chttpd]
authentication_handlers = {chttpd_auth, cookie_authentication_handler}, {couch_httpd_auth, proxy_authentication_handler}
```
3. Enable proxy authentication secret usage and define secret.  
```
[chttpd_auth]
proxy_use_secret = true
secret = <secret_goes_here>
```
4. Generate proxy authentication token to be used in `config.js` file (`dbToken`).  
```
echo -n "admin" | openssl sha1 -hmac "<secret_goes_here>"
```
Start the CouchDB service via `systemctl start couchdb`. To stop it run `systemctl stop couchdb`.  
To enable it as a system service (it will start automatically when the system starts) run `systemctl enable couchdb`. To disable it as a system service run `systemctl disable couchdb`.

5. Edit `config.js` file or use environment variables.

6. Create `keys` folder and provide the `keys/key.pem` and `keys/cert.pem` files. To manually create them for local testing use the commands below.
```
openssl genrsa -out key.pem
openssl req -new -key key.pem -out csr.pem
openssl x509 -req -days 9999 -in csr.pem -signkey key.pem -out cert.pem
rm csr.pem
```

7. Generate hashed password for admin user using the `hashSecret` secret from `config.js`.  
```
echo -n "<admin_password_goes_here>" | openssl sha1 -hmac "<hashSecret>"
```
8. Run `node dbSetup.js <hashed_admin_password>` to create admin user and db indexes.
