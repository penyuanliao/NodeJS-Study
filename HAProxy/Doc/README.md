

### HAProxy Config File
```
global
    # 最大人數 #
    maxconn 4096 
    # 背景執行用到 #
    pidfile ~/tmp/haproxy-queue.pid
    # HAProxy背景處理模式 #
    # daemon 
    
defaults
    log global
    #記錄網段網卡 {emerg | alert | crit | err | warning | notice | info | debug}
    log 127.0.0.1 local0 
    #初始值模組
    mode http
    #連線中斷時間
    timeout connect 30s
    timeout client 30s
    timeout server 30s
    #連線失敗後重新嘗試次數
    retries 3
    #在連接失敗或斷開的情況下，允許當前會話被重新分發
    option redispatch
    
    
frontend HTTP
    
    bind *:8080
    
    mode http  # { http | tcp | health }
    
    # --- socket.io connected start --- #
    # 必須設定
    # Server#path(v:String):Server
    # Sets the path v under which engine.io and the static files will be
    # served. Defaults to /socket.io.
    #
    acl is_chat path_beg /socket.io/mygame1

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

# 管理頁面
listen haproxyapp_admin:9100 127.0.0.1:9100
  mode http
  stats uri /

```
