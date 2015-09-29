

### HAProxy Config File
```
global

defaults

frontend HTTP
    
    bind *:8080
    
    mode http  # { http | tcp | health }
    
    # --- socket.io connected start --- #
    acl is_chat path_beg /chat
    use_backend socket.io-GAME1 if is_chat
    # --- socket.io connected end
    
    
    default_backend socket.io-GAME1
frontend APP

    mode tcp
    bind *:8081
    default_backend socket.io-GAME2

backend socket.io-GAME1
    mode http
    
    option httplog
    
    # add X-Forwarded-For info
    option forwardfor
    
    # don't close websocket connection 
    no option httpclose
    
    # haproxy server close
    option http-server-close
    
    option forceclose
    
    # 加入伺服器:8081 最大連線數 2000 檢查伺服器狀態()
    server node1 127.0.0.1:8081 maxconn check
    
    
backend socket.io-GAME2
    server 127.0.0.1:8092


```
