## web全栈练习项目-kkb

- 麻雀虽小,五脏俱全
- `jwt`,文件上传,多对多模型设计
- 错误收集,监控,团队规范(代码,log)
- 技术选型,管理能力,深度思考



## 技术选型

- `Vue`+`nuxt` or react+next (`SSR`原理一致)
- 小程序,`APP`,`Node(EGG)`
- 埋点(原理+第三方),发布(`gitlab`,CI)
- 报错sentry,报警(钉钉 or 微信 or 短信)
- 其他基建(搭建,docker,看板,文档,权限,组件)



## Docker部署

### 部署
```bash
docker-compose up -d
```

### 强制重新部署
```bash
docker-compose up --force-recreate --build
```

### 初始化数据
```bash
./dump/restore.sh
# 或
docker-compose exec mongo mongorestore --db kkbhub ./kkbhub
```
### 启动本地`Mongo`
```bash
docker-compose up mongo mongo-express
```

### 备份数据
```bash
docker-compose exec mongo mongodump --db kkbhub --out ../dump
```

