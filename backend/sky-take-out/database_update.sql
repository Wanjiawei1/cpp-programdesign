-- 微信登录功能数据库升级脚本
-- 为user表添加新字段以支持微信用户信息

-- 添加微信昵称字段
ALTER TABLE user ADD COLUMN nick_name VARCHAR(50) DEFAULT NULL COMMENT '微信昵称';

-- 添加微信头像URL字段  
ALTER TABLE user ADD COLUMN avatar_url VARCHAR(500) DEFAULT NULL COMMENT '微信头像地址';

-- 添加性别字段（微信格式：0未知，1男，2女）
ALTER TABLE user ADD COLUMN gender INT DEFAULT NULL COMMENT '性别 0:未知 1:男 2:女';

-- 查看更新后的表结构
DESC user;
