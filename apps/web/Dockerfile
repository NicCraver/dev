# 静态资源在 deploy 脚本中本地 vp build，此处只打包 nginx
FROM nginx:1.27-alpine

COPY scripts/nginx/docker.conf /etc/nginx/conf.d/default.conf
COPY apps/web/dist /usr/share/nginx/html

EXPOSE 80
