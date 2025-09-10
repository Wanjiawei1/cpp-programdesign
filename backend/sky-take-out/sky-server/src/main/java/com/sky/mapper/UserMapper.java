package com.sky.mapper;


import com.sky.entity.User;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.time.LocalDateTime;
import java.util.Map;

@Mapper
public interface UserMapper {

    @Select("select * from user where openid=#{openid}")
    User getUserByOpenid(String openid);

    void insert(User user);
    
    void update(User user);
    
    //根据动态条件统计用户数量
    Integer countByMap(Map<String, Object> map);
}
