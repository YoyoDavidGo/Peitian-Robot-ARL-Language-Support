# ARL 指令向导文档 v4.5.0
# 导出自 ARL编程助手

---

# ═══ 逻辑指令 (Logic) ═══

## if
desc: 条件判断，满足时执行块内代码
desc_en: Conditional: execute block when true
type: logic
proto: if(bool 表达式)
params: 1

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| cond | bool | * |  |  | getdi(1),$B[1] | 判断条件 | condition |

---


---

## elseif
desc: 前一条件不满足时检查此条件
desc_en: Check this condition when previous is false
type: logic
proto: elseif(bool 表达式)
params: 1

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| cond | bool | * |  |  | getdi(1),$B[1] | 判断条件 | condition |

---


---

## else
desc: 所有 if/elseif 条件均不满足时的默认分支
desc_en: Default branch when all conditions false
type: logic
proto: else
params: 0

---


---

## endif
desc: 结束 if/elseif/else 条件块
desc_en: End if/elseif/else block
type: logic
proto: endif
params: 0

---


---

## while
desc: 当条件成立时循环，先判断后执行
desc_en: While loop (check-first)
type: logic
proto: while(bool 表达式)
params: 1

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| cond | bool | * |  |  | 1,0,getdi(1),$B[1] | 循环条件 | loop cond |

---


---

## endwhile
desc: 结束 while 循环块
desc_en: End while block
type: logic
proto: endwhile
params: 0

---


---

## for
desc: 步进循环
desc_en: For loop
type: logic
proto: for(初始化; bool表达式; 迭代)
params: 3

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| init | string | * |  |  | int i1=0,i1=0 | 初始化语句 如 i=0 | init e.g. i=0 |
| cond | bool | * |  |  | i1<10 | 循环条件 如 i<10 | cond e.g. i<10 |
| iter | string | * |  |  | i1++ | 迭代语句 如 i=i+1 | iter e.g. i=i+1 |

---


---

## endfor
desc: 结束 for 循环块
desc_en: End for block
type: logic
proto: endfor
params: 0

---


---

## repeat
desc: 直到型循环起始，先执行后判断
desc_en: Repeat-until loop (execute-first)
type: logic
proto: repeat
params: 0

---


---

## until
desc: 直到型循环结束条件，表达式为真时退出
desc_en: Until condition (exit when true)
type: logic
proto: until(bool 表达式)
params: 1

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| cond | bool | * |  |  | getdi(1),$B[1] | 退出条件 | exit cond |

---


---

## loop
desc: 无限循环起始，需配合 break 退出
desc_en: Infinite loop (use break to exit)
type: logic
proto: loop
params: 0

---


---

## endloop
desc: 结束 loop 无限循环块
desc_en: End loop block
type: logic
proto: endloop
params: 0

---


---

## switch
desc: 多分支判断，根据表达式值匹配 case
desc_en: Switch: multi-branch by expression value
type: logic
proto: switch(表达式)
params: 1

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| expr | int | * |  |  | i,n,m,$PGNO | 判断表达式 | expression |

---


---

## case
desc: switch 的分支匹配项
desc_en: Switch case branch
type: logic
proto: case 常量值:
params: 1

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| value | int | * |  |  | 0,1,2,3,4,5,6,7,8,9 | 匹配常量值 | match value |

---


---

## default
desc: switch 无匹配 case 时的默认分支
desc_en: Default branch when no case matches
type: logic
proto: default:
params: 0

---


---

## endswitch
desc: 结束 switch 多分支块
desc_en: End switch block
type: logic
proto: endswitch
params: 0

---


---

## break
desc: 跳出最近一层循环（for/while/loop/switch）
desc_en: Break out of nearest loop
type: logic
proto: break
params: 0

---


---

## continue
desc: 跳过本次循环剩余代码，直接进入下一次循环
desc_en: Skip to next iteration
type: logic
proto: continue
params: 0

---


---

## goto
desc: 无条件跳转到指定标签处执行
desc_en: Unconditional jump to label
type: logic
proto: goto label
params: 1

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| label | string | * |  |  | lable1 | 跳转目标标签名 | label |

---


---

# ═══ 一般指令 (Instructions) ═══

## movej
desc: 关节插补运动
desc_en: Joint interpolation move
type: instruction
proto: movej j:<joint>, [v:|vp:], [s:|sp:|sl:], [t:], [dura:]
params: 1~5

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| j | joint | * |  |  | j1 | 目标关节位置 | target joint |
| v | speed |  |  |  | v1 | 速度 | speed |
| s | slip |  |  |  | s1 | 平滑 | blend |
| t | tool |  |  |  |  | 工具坐标系 | tool frame |
| dura | double |  |  |  |  | 持续时间 | duration |

### variant: 百分比速度
### variant_en: Speed %
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| j | joint | * |  |  | j1 | 目标关节位置 | target joint |
| vp | double |  | 0~100 | % | 10 | 速度百分比 | speed % |
| sp | double |  | 0~100 | % | -1 | 平滑距离 | blend dist |
| t | tool |  |  |  |  | 工具坐标系 | tool frame |

---


---

## ptp
desc: 点到点运动（自动选关节/直线）
desc_en: Point-to-point (auto joint/linear)
type: instruction
proto: ptp p:<pose>, [v:|vp:], [s:|sl:|sp:], [t:], [w:], [dura:]
params: 1~6

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| p | pose | * |  |  | p1,[null] | 目标位姿 | target pose |
| v | speed |  |  |  | v1 | 速度 | speed |
| s | slip |  |  |  | s1 | 平滑 | blend |
| t | tool |  |  |  | $FLANGE,$tool0,$tool1,$tool2 | 工具坐标系 | tool frame |
| w | wobj |  |  |  | $WORLD,$wobj0,$wobj1,$wobj2 | 工件坐标系 | work obj |

### variant: 百分比速度
### variant_en: Speed %
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| p | pose | * |  |  | p1,[null] | 目标位姿 | target pose |
| vp | double |  | 0~100 | % | 10 | 速度百分比 | speed % |
| sp | double |  | 0~100 | % | 0 | 平滑百分比 | blend % |
| t | tool |  |  |  | $FLANGE,$tool0,$tool1,$tool2 | 工具坐标系 | tool frame |
| w | wobj |  |  |  | $WORLD,$wobj0,$wobj1,$wobj2 | 工件坐标系 | work obj |

---


---

## lin
desc: 直线插补运动
desc_en: Linear interpolation move
type: instruction
proto: lin p:<pose>, [v:|vl:|vp:], [s:|sl:|sp:], [t:], [w:], [dura:]
params: 1~6

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| p | pose | * |  |  | p1,[null] | 目标位姿 | target pose |
| v | speed |  |  |  | v1 | 速度 | speed |
| s | slip |  |  |  | s1 | 平滑 | blend |
| t | tool |  |  |  | $FLANGE,$tool0,$tool1,$tool2 | 工具坐标系 | tool frame |
| w | wobj |  |  |  | $WORLD,$wobj0,$wobj1,$wobj2 | 工件坐标系 | work obj |

### variant: 数字写法
### variant_en: Numeric
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| p | pose | * |  |  | p1,[null] | 目标位姿 | target pose |
| vl | double |  | 0~2500 | mm/s | 250 | 直线速度 | linear speed |
| sl | double |  | 0~500 | mm | -1 | 平滑距离 | blend dist |
| t | tool |  |  |  | $FLANGE,$tool0,$tool1,$tool2 | 工具坐标系 | tool frame |
| w | wobj |  |  |  | $WORLD,$wobj0,$wobj1,$wobj2 | 工件坐标系 | work obj |

---


---

## cir
desc: 圆弧插补运动
desc_en: Circular interpolation move
type: instruction
proto: cir m:<pose>, p:<pose>, [v:|vl:|vp:], [s:|sl:|sp:], [t:], [w:], [CA:], [dura:]
params: 2~8

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| m | pose | * |  |  | p1,[null] | 中间过渡位姿 | mid pose |
| p | pose | * |  |  | p2 | 终点位姿 | end pose |
| v | speed |  |  |  | v1 | 速度 | speed |
| s | slip |  |  |  | s1 | 平滑 | blend |
| t | tool |  |  |  | $FLANGE,$tool0,$tool1,$tool2 | 工具坐标系 | tool frame |
| w | wobj |  |  |  | $WORLD,$wobj0,$wobj1,$wobj2 | 工件坐标系 | work obj |
| CA | double |  |  |  |  | 圆弧角度 | arc angle |

### variant: 数字写法
### variant_en: Numeric
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| m | pose | * |  |  | p1,[null] | 中间过渡位姿 | mid pose |
| p | pose | * |  |  | p2 | 终点位姿 | end pose |
| vl | double |  |  | mm/s | 250 | 直线速度 | linear speed |
| sl | double |  | 0~500 | mm | 0 | 平滑距离 | blend dist |
| t | tool |  |  |  | $FLANGE,$tool0,$tool1,$tool2 | 工具坐标系 | tool frame |
| w | wobj |  |  |  | $WORLD,$wobj0,$wobj1,$wobj2 | 工件坐标系 | work obj |
| CA | double |  |  |  |  | 圆弧角度 | arc angle |

---


---

## ccir
desc: 整圆插补运动
desc_en: Full circle interpolation
type: instruction
proto: ccir p:<pose>, [v:|vl:|vp:], [s:|sl:|sp:], [t:], [w:]
params: 1~5

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| p | pose | * |  |  | p1,[null] | 目标位姿 | target pose |
| v | speed |  |  |  | v1 | 速度 | speed |
| s | slip |  |  |  | s1 | 平滑 | blend |
| t | tool |  |  |  | $FLANGE,$tool0,$tool1,$tool2 | 工具坐标系 | tool frame |
| w | wobj |  |  |  | $WORLD,$wobj0,$wobj1,$wobj2 | 工件坐标系 | work obj |

### variant: 数字写法
### variant_en: Numeric
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| p | pose | * |  |  | p1,[null] | 目标位姿 | target pose |
| vl | double |  | 0~2500 | mm/s | 250 | 直线速度 | linear speed |
| sl | double |  | 0~500 | mm | 0 | 平滑距离 | blend dist |
| t | tool |  |  |  | $FLANGE,$tool0,$tool1,$tool2 | 工具坐标系 | tool frame |
| w | wobj |  |  |  | $WORLD,$wobj0,$wobj1,$wobj2 | 工件坐标系 | work obj |

---


---

## spl
desc: 样条插补运动
desc_en: Spline interpolation move
type: instruction
proto: spl p:<pose>, [v:|vp:], [sl:], [t:], [w:]
params: 1~5

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| p | pose | * |  |  | p1,[null] | 样条路径点位姿 | spline point |
| v | speed |  |  |  | v1 | 速度 | speed |
| sl | double |  | 0~500 | mm | 10 | 平滑距离 | blend dist |
| t | tool |  |  |  | $FLANGE,$tool0,$tool1,$tool2 | 工具坐标系 | tool frame |
| w | wobj |  |  |  | $WORLD,$wobj0,$wobj1,$wobj2 | 工件坐标系 | work obj |

### variant: 速度数字写法
### variant_en: Numeric
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| p | pose | * |  |  | p1,[null] | 样条路径点位姿 | spline point |
| vp | speed |  | 0~100 | % | 10 | 百分比速度 | speed % |
| sl | double |  | 0~500 | mm | 10 | 平滑距离 | blend dist |
| t | tool |  |  |  | $FLANGE,$tool0,$tool1,$tool2 | 工具坐标系 | tool frame |
| w | wobj |  |  |  | $WORLD,$wobj0,$wobj1,$wobj2 | 工件坐标系 | work obj |

---


---

## jump
desc: 跳跃运动（带拾取高度控制）
desc_en: Jump motion (pick height control)
type: instruction
proto: jump p:<pose>, [v:|vp:], [t:], [w:], [a:], [b:], [Z:], [s:], [ctr:], [sig:]
params: 1~10

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| p | pose | * |  |  | p1,[null] | 目标位姿 | target pose |
| v | speed |  |  |  | v1 | 速度 | speed |
| t | tool |  |  |  | $FLANGE,$tool0,$tool1,$tool2 | 工具坐标系 | tool frame |
| w | wobj |  |  |  | $WORLD,$wobj0,$wobj1,$wobj2 | 工件坐标系 | work obj |
| a | double |  |  |  | 50 | 抬起高度 | lift height |
| b | double |  |  |  | 50 | 下降高度 | lower height |
| Z | double |  |  |  | -10 | 最大抬高度 | max height |
| s | bool |  | 0,1 |  | 1,0 | 是否平滑 | smooth |
| ctr | control |  |  |  |  | 门型动作的控制参数 arch ctrl | control parameters for arch motion |
| sig | bool |  |  |  |  | 等待信号 | wait signal |

### variant: 数字写法
### variant_en: Numeric
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| p | pose | * |  |  | p1,[null] | 目标位姿 | target pose |
| vp | speed |  | 1~100 | % | 50 | 百分比速度 | speed % |
| t | tool |  |  |  | $FLANGE,$tool0,$tool1,$tool2 | 工具坐标系 | tool frame |
| w | wobj |  |  |  | $WORLD,$wobj0,$wobj1,$wobj2 | 工件坐标系 | work obj |
| a | double |  |  |  | 50 | 抬起高度 | lift height |
| b | double |  |  |  | 50 | 下降高度 | lower height |
| Z | double |  |  |  | -10 | 最大抬高度 | max height |
| s | bool |  | 0,1 |  | 1,0 | 是否平滑 | smooth |
| ctr | control |  |  |  |  | 门型动作的控制参数 arch ctrl | control parameters for arch motion |
| sig | bool |  |  |  |  | 等待信号 | wait signal |

---


---

## waittime
desc: 等待指定秒数
desc_en: Wait for specified seconds
type: instruction
proto: waittime time:<double>
params: 1

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| time | double | * |  |  | 0.5,1,0.2 | 等待时间 | wait time |

---


---

## waituntil
desc: 等待条件成立
desc_en: Wait until condition is true
type: instruction
proto: waituntil cond:, [maxtime:], [timeoutflag:]
params: 1~3

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| cond | bool | * |  |  | getdi(1) | 等待条件表达式 | condition |
| maxtime | double |  |  |  |  | 最长等待时间 | max wait |
| timeoutflag | bool |  |  |  |  | 超时标志变量 | timeout flag |

---


---

## stopmove
desc: 停止运动
desc_en: Stop motion
type: instruction
proto: stopmove [type:]
params: 0~1

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| type | string |  | general,fast |  | general,fast | 停止类型 | stop type |

---


---

## startmove
desc: 启动运动
desc_en: Start motion
type: instruction
proto: startmove [skip:]
params: 0~1

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| skip | int |  | 0~10 |  | 2,3,4 | 是否跳过缓存运动 | skip buffered |

---


---

## pause
desc: 暂停程序执行
desc_en: Pause program
type: instruction
proto: pause
params: 0

---


---

## exit
desc: 退出当前程序
desc_en: Exit program
type: instruction
proto: exit
params: 0

---


---

## restart
desc: 重启程序
desc_en: Restart program
type: instruction
proto: restart
params: 0

---


---

## velset
desc: 速度调节，设置速度倍率和最大速度
desc_en: Speed adjustment: override & max speed
type: instruction
proto: velset override:, max:
params: 2

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| override | double | * | 0~100 |  | 50,80 | 速度倍率百分比 | override % |
| max | double | * | 0~2500 |  | 500,1000 | 最大速度 | max speed |

---


---

## accset
desc: 加速度调节
desc_en: Acceleration adjustment
type: instruction
proto: accset acc:, ramp:
params: 2

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| acc | double | * | 0~800 |  | 300,200,150 | 加速度百分比 | acc % |
| ramp | double | * | 0~800 |  | 300,200,150 | 加速斜率百分比 | ramp % |

---


---

## interrupt
desc: 声明中断事件
desc_en: Declare interrupt event
type: instruction
proto: interrupt [name:], [priority:], when:, do:
params: 2~4

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| name | string |  |  |  |  | 中断名称 | int name |
| priority | int |  | 0~9 |  | 0,1,2 | 优先级 | priority |
| when | bool | * |  |  | getdi(1) | 触发条件 | trigger cond |
| do | function | * |  |  |  | 响应函数名 | handler |

---


---

## timer
desc: 定时器中断
desc_en: Timer interrupt
type: instruction
proto: timer [name:], [priority:], interval:, [rmode:], do:
params: 3~5

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| name | string |  |  |  |  | 定时器名称 | timer name |
| priority | int |  | 0~9 |  | 0,1,2 | 优先级 | priority |
| interval | double | * |  |  | 0.1,0.2,0.5,1 | 定时间隔 | interval |
| rmode | bool |  | 0,1 |  | 1,0 | 重复模式 | repeat mode |
| do | function | * |  |  |  | 响应函数名 | handler |

---


---

## trigger
desc: 轨迹触发事件
desc_en: Path trigger event
type: instruction
proto: trigger [priority:], when:, do:
params: 2~3

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| priority | int |  | 0~9 |  | 0,1,2 | 优先级 | priority |
| when | bool | * |  |  | P(0),P(100),P(50) | 触发条件 | trigger cond |
| do | function | * |  |  |  | 响应函数名 | handler |

---


---

## disableint
desc: 禁用中断
desc_en: Disable interrupt
type: instruction
proto: disableint [name:], [priority:]
params: 0~2

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| name | string |  |  |  |  | 中断名称 | int name |
| priority | int |  | 0~9 |  | 0,1,2 | 优先级 | priority |

---


---

## enableint
desc: 启用中断
desc_en: Enable interrupt
type: instruction
proto: enableint [name:], [priority:]
params: 0~2

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| name | string |  |  |  |  | 中断名称 | int name |
| priority | int |  | 0~9 |  | 0,1,2 | 优先级 | priority |

---


---

## delint
desc: 删除中断
desc_en: Delete interrupt
type: instruction
proto: delint [name:], [priority:]
params: 0~2

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| name | string |  |  |  |  | 中断名称 | int name |
| priority | int |  | 0~9 |  | 0,1,2 | 优先级 | priority |

---


---

## toolswitch
desc: 工具负载切换
desc_en: Tool load switch
type: instruction
proto: toolswitch toolindex:<int>, mu_name:<string>
params: 2

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| toolindex | int | * |  |  | 0 | 工具索引号 | tool idx |
| mu_name | string | * |  |  | "R1" | 机械单元名称 | mech unit |

---


---

## startdetect
desc: 开启碰撞检测
desc_en: Enable collision detection
type: instruction
proto: startdetect cid:<int>, mu:<string>
params: 2

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| cid | int | * |  |  | 0 | 检测配置ID | detect ID |
| mu | string | * |  |  | "R1" | 机械单元名称 | mech unit |

---


---

## enddetect
desc: 关闭碰撞检测
desc_en: Disable collision detection
type: instruction
proto: enddetect mu:<string>
params: 1

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| mu | string | * |  |  | "R1" | 机械单元名称 | mech unit |

---


---

## startweave
desc: 开启叠加摆动
desc_en: Enable weaving
type: instruction
proto: startweave weave:weavedata, mu:"mu_name"
params: 2

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| weave | weavedata | * |  |  | weavedatalin1 | 摆动参数 | weave data |
| mu | string | * |  |  | "R1" | 机械单元名称 | mech unit |

---


---

## endweave
desc: 结束叠加摆动
desc_en: End weaving
type: instruction
proto: endweave mu:"mu_name"
params: 1

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| mu | string | * |  |  | "R1" | 机械单元名称 | mech unit |

---


---

## startcompen
desc: 开始轨迹补偿
desc_en: Start path compensation
type: instruction
proto: startcompen id:<int>, type:<int>, data:<compendata>, dataj:<compendata>
params: 4

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| id | int | * | 1~99 |  | 1,2,3 | 补偿ID | compen ID |
| type | int | * | "TOOL","WOBJTOOL","PATH","MODIFY_PATH","WORLD" |  | "TOOL","WOBJTOOL","PATH","MODIFY_PATH","WORLD" | 补偿类型 | type |
| data | compendata | * |  |  | data1 | 位姿补偿数据 | pose compen |
| dataj | compendata | * |  |  | dataj1 | 关节补偿数据 | joint compen |

---


---

## endcompen
desc: 结束轨迹补偿
desc_en: End path compensation
type: instruction
proto: endcompen
params: 0

---


---

## compen
desc: 设置轨迹补偿参数
desc_en: Set path compensation params
type: instruction
proto: compen [id:], [x:], [y:], [z:], [a:], [b:], [c:], ...
params: 1~N

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| id | int |  |  |  | 1 | 序号,用于匹配 | index for matching |
| x | double |  |  |  | 0 | X方向偏移量 | X offset |
| y | double |  |  |  | 0 | Y方向偏移量 | Y offset |
| z | double |  |  |  | 0 | Z方向偏移量 | Z offset |
| a | double |  |  |  | 0 | z角度偏移量 | rotation offset about Z |
| b | double |  |  |  | 0 | y角度偏移量 | rotation offset about Y |
| c | double |  |  |  | 0 | x角度偏移量 | rotation offset about X |

---


---

## import
desc: 导入ARL模块
desc_en: Import ARL module
type: instruction
proto: import modpath:<string>
params: 1

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| modpath | string | * |  |  | "script/new_folder1/demo.arl" | 模块路径字符串 | mod path |

---


---

## print
desc: 打印输出，支持多参数/文件输出/精度控制
desc_en: Print output (multi-arg / file / precision)
type: instruction
proto: print [to:], [tostr:], [filepath:], [precision:], [numbase:], {argtoprint}
params: 1~N

### variant: 基本输出
### variant_en: Basic print
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| argtoprint | any | * |  |  |  | 要打印的变量或表达式 | value |
| argtoprint | any |  |  |  |  | 要打印的变量或表达式 | value |
| argtoprint | any |  |  |  |  | 要打印的变量或表达式 | value |
| argtoprint | any |  |  |  |  | 要打印的变量或表达式 | value |

### variant: 输出到文件
### variant_en: Print to file
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| to | int | * | file,hmi,off |  | file,hmi,off | 输出目标 | dest |
| filepath | string | * |  |  | "script/new_folder1/log1" | 文件路径 | file path |
| argtoprint | any | * |  |  |  | 要打印的变量或表达式 | value |
| argtoprint | any |  |  |  |  | 要打印的变量或表达式 | value |
| argtoprint | any |  |  |  |  | 要打印的变量或表达式 | value |

---


---

## scan
desc: 扫描输入字符串，按分隔符解析至变量
desc_en: Scan string by delimiter to variables
type: instruction
proto: scan from:<string>, delimiter:<string>, {argtosave}
params: 3~N

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| from | string | * |  |  | recdata | 源字符串 | src str |
| delimiter | string | * |  |  | ",","#"," " | 分隔符 | delimiter |
| argtosave | any | * |  |  | px | 接收变量 | output variable |
| argtosave | any |  |  |  | py | 接收变量 | output variable |
| argtosave | any |  |  |  | pa | 接收变量 | output variable |
| argtosave | any |  |  |  | endcut | 接收变量 | output variable |

---


---

## palletcompen
desc: 计算码垛补偿点位
desc_en: Calculate pallet compensation point
type: instruction
proto: pose palletcompen(pallet, double X_offset, double Y_offset, pose P)
params: 4

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| pallet | pallet | * |  |  | pallet1 | 码垛参数 | pallet |
| X_offset | double | * |  |  | 50 | X方向偏移mm | X offset (mm) |
| Y_offset | double | * |  |  | 50 | Y方向偏移mm | Y offset (mm) |
| P | pose | * |  |  | $P[1] | 基准位姿 | base pose |

---


---

# ═══ 函数 (Functions) ═══

## setinterpercent
desc: 设置机器人运行速度倍率
desc_en: Set robot speed override
type: function
proto: setinterpercent(per)
params: 1

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| per | int | * | 0~100 |  | 30,50,80,100 | 速度倍率(%) | speed override (%) |

---


---

## getinterpercent
desc: 获取机器人当前运行速度倍率
desc_en: Get robot speed override
type: function
proto: getinterpercent()
params: 0

---


---

## setdo
desc: 设置数字量输出
desc_en: Set digital output
type: function
proto: void setdo(int chan, bool value)
params: 2~3

### variant: 单通道
### variant_en: Single CH
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| chan | int | * |  |  | 1,2,3,4,5,6 | 通道号 | channel |
| val | bool | * | 0,1 |  | 1,0 | 输出值 | value |

### variant: 多通道
### variant_en: Multi CH
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| from | int | * |  |  | 1 | 起始通道 | from ch |
| to | int | * |  |  | 2 | 结束通道 | to ch |
| val | int | * | 0~4294967295 |  | 1 | 输出值 | value |

---


---

## syncdo
desc: 同步设置数字量输出（随运动同步）
desc_en: Sync set digital output (motion-sync)
type: function
proto: void syncdo(int chan, bool value)
params: 2~3

### variant: 单通道
### variant_en: Single CH
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| chan | int | * |  |  | 1 | 通道号 | channel |
| val | int | * | 0,1 |  | 1,0 | 输出值 | value |

### variant: 多通道
### variant_en: Multi CH
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| from | int | * |  |  | 1 | 起始通道 | from ch |
| to | int | * |  |  | 2 | 结束通道 | to ch |
| val | int | * | 0~4294967295 |  | 1 | 输出值 | value |

---


---

## pulsedo
desc: 输出数字脉冲
desc_en: Output digital pulse
type: function
proto: void pulsedo(int chan, bool value, double width)
params: 3

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| chan | int | * |  |  | 1 | 通道号 | channel |
| val | bool | * | 0,1 |  | 1,0 | 脉冲值 | pulse val |
| width | double | * |  |  | 1 | 脉冲宽度 | width |

---


---

## setao
desc: 设置模拟量输出
desc_en: Set analog output
type: function
proto: void setao(int chan, double value)
params: 2

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| chan | int | * |  |  | 1,2,3,4,5,6 | 通道号 | channel |
| val | double | * |  |  | 1.1 | 输出值 | value |

---


---

## syncao
desc: 同步设置模拟量输出
desc_en: Sync set analog output
type: function
proto: void syncao(int chan, double value)
params: 2

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| chan | int | * |  |  | 1,2,3,4,5,6 | 通道号 | channel |
| val | double | * |  |  | 1.1 | 输出值 | value |

---


---

## setpwm
desc: 设置PWM输出
desc_en: Set PWM output
type: function
proto: bool setpwm(int channel, int freq, int ratio)
params: 3

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| channel | int | * |  |  | 1,2,3,4,5,6 | 通道号 | channel |
| freq | double | * | 10~1000 |  | 20,50,100 | 频率 Hz | freq Hz |
| ratio | double | * | 0~100 |  | 50 | 占空比 | duty % |

---


---

## getdo
desc: 读取数字量输出
desc_en: Read digital output
type: function
proto: bool getdo(int chan)
params: 1~2

### variant: 单通道
### variant_en: Single CH
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| chan | int | * |  |  | 1 | 通道号 | channel |

### variant: 多通道
### variant_en: Multi CH
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| from | int | * |  |  | 1 | 起始通道 | from ch |
| to | int | * |  |  | 2 | 结束通道 | to ch |

---


---

## getdi
desc: 读取数字量输入
desc_en: Read digital input
type: function
proto: bool getdi(int chan)
params: 1~2

### variant: 单通道
### variant_en: Single CH
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| chan | int | * |  |  | 1 | 通道号 | channel |

### variant: 多通道
### variant_en: Multi CH
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| from | int | * |  |  | 1 | 起始通道 | from ch |
| to | int | * |  |  | 2 | 结束通道 | to ch |

---


---

## getai
desc: 读取模拟量输入
desc_en: Read analog input
type: function
proto: double getai(int chan)
params: 1

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| chan | int | * |  |  | 1 | 通道号 | channel |

---


---

## getao
desc: 读取模拟量输出
desc_en: Read analog output
type: function
proto: double getao(int chan)
params: 1

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| chan | int | * |  |  | 1 | 通道号 | channel |

---


---

## getintdo
desc: 读取INT型数字量输出
desc_en: Read INT digital output
type: function
proto: getintdo(chan)
params: 1

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| chan | int | * |  |  | 1 | 通道号 | channel |

---


---

## getintdi
desc: 读取INT型数字量输入
desc_en: Read INT digital input
type: function
proto: getintdi(chan)
params: 1

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| chan | int | * |  |  | 1 | 通道号 | channel |

---


---

## init
desc: 恢复系统变量为默认值
desc_en: Reset system variables to defaults
type: function
proto: init()
params: 0

---


---

## main
desc: 入口函数，程序复位后程序指针指向第一行
desc_en: Entry function; pointer starts here after reset
type: function
proto: main()
params: 0

---


---

## savesv
desc: 存储系统变量至配置文件
desc_en: Save system variable to config file
type: function
proto: void savesv(string svname)
params: 1

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| svname | string | * |  |  | "I","D","B","P","J","S" | 系统变量名 | sv name |

---


---

## typeof
desc: 返回变量类型字符串
desc_en: Return variable type as string
type: function
proto: typeof(var)
params: 1

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| var | any | * |  |  |  | 任意变量 | any var |

---


---

## ctime
desc: 返回当前时间字符串
desc_en: Return current time string
type: function
proto: ctime()
params: 0

---


---

## cdate
desc: 返回当前日期字符串
desc_en: Return current date string
type: function
proto: cdate()
params: 0

---


---

## assert
desc: 断言，条件false时终止程序
desc_en: Assert; stops program if condition false
type: function
proto: assert(cond)
params: 1

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| cond | bool | * |  |  | 0,getdi(1),$B[1] | 断言条件 | cond |

---


---

## toascii
desc: 获取字符串首字符对应的ASCII码值
desc_en: Get ASCII code of first character
type: function
proto: int toascii(string s)
params: 1

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| s | string | * |  |  |  | 输入字符串 | input str |

---


---

## setip
desc: 设置网口IP地址配置
desc_en: Set network interface IP config
type: function
proto: bool setip(string ip, string gate, string mask [, string if_name])
params: 3~4

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| ip | string | * |  |  | "192.168.1.1","192.168.2.1" | IP地址 | ip addr |
| gate | string | * |  |  | "192.168.1.111","192.168.2.111" | 网关 | gateway |
| mask | string | * | "255.255.255.0" |  | "255.255.255.0" | 子网掩码 | mask |
| if_name | string |  | "eth1","eth2","eth3" |  | "eth1","eth2","eth3" | 网口名称 | if name |

---


---

## getip
desc: 获取网口IP地址配置
desc_en: Get network interface IP config
type: function
proto: bool getip(string ip [, string if_name])
params: 1~2

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| ip | string | * |  |  | robot_ip | IP地址变量 | ip var |
| if_name | string |  | "eth1","eth2","eth3" |  | "eth1","eth2","eth3" | 网口名称 | if name |

---


---

## addslave
desc: 配置Modbus一主多从从站
desc_en: Configure Modbus master-slave
type: function
proto: bool addslave(modbus_rtu_master dev, int slave_id)
params: 2

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| dev | modbus_rtu_master | * |  |  | m2 | 主站设备 | master dev |
| slave_id | int | * |  |  | 2,1,3 | 从站ID | slave ID |

---


---

## setcycle
desc: 设置Modbus通讯周期
desc_en: Set Modbus communication cycle
type: function
proto: void setcycle(modbus_dev& dev, int cycle)
params: 2

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| dev | modbus_dev | * |  |  | m_dev | Modbus设备 | modbus dev |
| cycle | int | * | >500000 |  | 1000000,2000000,3000000 | 通讯周期us | communication cycle (us) |

---


---

## switcharl
desc: 切换前台加载的ARL程序
desc_en: Switch foreground ARL program
type: function
proto: bool switcharl(uint channel, string file_name)
params: 2

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| channel | int | * | 1~6 |  | 1,2,3 | 通道号 | channel |
| file_name | string | * |  |  | "script/new_folder1/demo.arl" | ARL文件路径 | ARL file |

---


---

## switchbackarl
desc: 切换后台加载的ARL程序
desc_en: Switch background ARL program
type: function
proto: bool switchbackarl(uint channel, string file_name)
params: 2

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| channel | int | * | 1~6 |  | 1,2,3 | 通道号 | channel |
| file_name | string | * |  |  | "script/new_folder1/demo.arl" | ARL文件路径 | ARL file |

---


---

## startbackchannel
desc: 启动指定的后台通道
desc_en: Start specified background channel
type: function
proto: void startbackchannel(int chan_no)
params: 1

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| chan_no | int | * | 1~6 |  | 1,2,3 | 后台通道号 | bg channel |

---


---

## pausebackchannel
desc: 暂停指定的后台通道
desc_en: Pause specified background channel
type: function
proto: void pausebackchannel(int chan_no)
params: 1

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| chan_no | int | * | 1~6 |  | 1,2,3 | 后台通道号 | bg channel |

---


---

## resetbackchannel
desc: 复位指定的后台通道
desc_en: Reset specified background channel
type: function
proto: void resetbackchannel(int chan_no)
params: 1

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| chan_no | int | * | 1~6 |  | 1,2,3 | 后台通道号 | bg channel |

---


---

## curmpfile
desc: 获取运动指针当前所在ARL文件名
desc_en: Get motion pointer current file
type: function
proto: string curmpfile(int channel_index)
params: 1

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| channel_index | int | * | 1~6 |  | 1,2,3 | 通道索引 | channel idx |

---


---

## curmpline
desc: 获取运动指针当前所在行号
desc_en: Get motion pointer current line
type: function
proto: int curmpline(int channel_index)
params: 1

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| channel_index | int | * | 1~6 |  | 1,2,3 | 通道索引 | channel idx |

---


---

## curppfile
desc: 获取程序指针当前所在ARL文件名
desc_en: Get program pointer current file
type: function
proto: string curppfile(int channel_index)
params: 1

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| channel_index | int | * | 1~6 |  | 1,2,3 | 通道索引 | channel idx |

---


---

## curppline
desc: 获取程序指针当前所在行号
desc_en: Get program pointer current line
type: function
proto: int curppline(int channel_index)
params: 1

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| channel_index | int | * | 1~6 |  | 1,2,3 | 通道索引 | channel idx |

---


---

## abs
desc: 绝对值
desc_en: Absolute value
type: function
proto: double abs(double x) 或 int abs(int x)
params: 1

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| x | double | * |  |  |  | 输入值 | input |

---


---

## sqrt
desc: 平方根
desc_en: Square root
type: function
proto: double sqrt(double x)
params: 1

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| x | double | * | >=0 |  |  | 输入值 | input |

---


---

## sin
desc: 正弦（弧度）
desc_en: Sine (radians)
type: function
proto: double sin(double x)
params: 1

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| angle | double | * |  |  |  |  | angle (rad) |

---


---

## cos
desc: 余弦（弧度）
desc_en: Cosine (radians)
type: function
proto: double cos(double x)
params: 1

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| angle | double | * |  |  |  | 角度rad | angle (rad) |

---


---

## tan
desc: 正切（弧度）
desc_en: Tangent (radians)
type: function
proto: double tan(double x)
params: 1

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| angle | double | * |  |  |  | 角度rad | angle (rad) |

---


---

## asin
desc: 反正弦，返回弧度
desc_en: Arc sine (radians)
type: function
proto: double asin(double x)
params: 1

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| x | double | * | -1~1 |  |  | 输入值 | input |

---


---

## acos
desc: 反余弦，返回弧度
desc_en: Arc cosine (radians)
type: function
proto: double acos(double x)
params: 1

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| x | double | * | -1~1 |  |  | 输入值 | input |

---


---

## atan
desc: 反正切，返回弧度
desc_en: Arc tangent (radians)
type: function
proto: double atan(double x)
params: 1

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| x | double | * |  |  |  | 输入值 | input |

---


---

## atan2
desc: 四象限反正切
desc_en: Four-quadrant arc tangent
type: function
proto: double atan2(double y, double x)
params: 2

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| y | double | * |  |  |  | y分量 | y |
| x | double | * |  |  |  | x分量 | x |

---


---

## sinh
desc: 双曲正弦
desc_en: Hyperbolic sine
type: function
proto: double sinh(double x)
params: 1

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| x | double | * |  |  |  | 输入值 | input |

---


---

## cosh
desc: 双曲余弦
desc_en: Hyperbolic cosine
type: function
proto: double cosh(double x)
params: 1

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| x | double | * |  |  |  | 输入值 | input |

---


---

## tanh
desc: 双曲正切
desc_en: Hyperbolic tangent
type: function
proto: double tanh(double x)
params: 1

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| x | double | * |  |  |  | 输入值 | input |

---


---

## exp
desc: e的x次方
desc_en: e to the power x
type: function
proto: double exp(double x)
params: 1

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| x | double | * |  |  |  | 指数值 | exponent |

---


---

## pow
desc: 幂运算
desc_en: Power operation
type: function
proto: double pow(double x, double y)
params: 2

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| base | double | * |  |  |  | 底数 | base |
| exp | double | * |  |  |  | 指数 | exp |

---


---

## pow10
desc: 10的n次方
desc_en: 10 to the power n
type: function
proto: double pow10(double x)
params: 1

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| n | double | * |  |  |  | 指数 | exp |

---


---

## log
desc: 自然对数 ln(x)
desc_en: Natural logarithm ln(x)
type: function
proto: double log(double x)
params: 1

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| x | double | * | >0 |  |  | 输入值 | input |

---


---

## log10
desc: 以10为底对数
desc_en: Base-10 logarithm
type: function
proto: double log10(double x)
params: 1

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| x | double | * | >0 |  |  | 输入值 | input |

---


---

## floor
desc: 向下取整
desc_en: Floor
type: function
proto: double floor(double x)
params: 1

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| x | double | * |  |  |  | 输入值 | input |

---


---

## ceil
desc: 向上取整
desc_en: Ceiling
type: function
proto: double ceil(double x)
params: 1

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| x | double | * |  |  |  | 输入值 | input |

---


---

## fmod
desc: 浮点取余
desc_en: Float modulo
type: function
proto: double fmod(double x, double y)
params: 2

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| x | double | * |  |  |  | 被除数 | dividend |
| y | double | * |  |  |  | 除数 | divisor |

---


---

## modf
desc: 分离整数与小数部分
desc_en: Split integer and fractional parts
type: function
proto: double modf(double x, int &y)
params: 1

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| x | double | * |  |  |  | 被分解的浮点数 | Decomposed floating-point numbers |
| y | int | * |  |  |  | 返回的浮点数的整数部分 | The integer part of the returned floating-point number |

---


---

## hypot
desc: 计算直角三角形斜边长 √(x²+y²)
desc_en: Hypotenuse √(x²+y²)
type: function
proto: double hypot(double x, double y)
params: 2

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| x | double | * |  |  |  | x边长 | x |
| y | double | * |  |  |  | y边长 | y |

---


---

## rand
desc: 产生随机数
desc_en: Generate random number
type: function
proto: int rand() 或 double rand(double start, double end)
params: 2

### variant: 范围随机数
### variant_en: Range random
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| start | double | * |  |  |  | 最小值 | min |
| end | double | * |  |  |  | 最大值 | max |

---


---

## norm
desc: 求向量距离原点的长度（模）
desc_en: Vector magnitude (norm)
type: function
proto: double norm(pos p)
params: 1

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| p | pos | * |  |  | pos1 | 向量 | vector |

---


---

## trunc
desc: 截断浮点数至指定小数位
desc_en: Truncate float to N decimals
type: function
proto: double trunc(double num, int n, bool round)
params: 3

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| num | double | * |  |  |  | 输入值 | input |
| n | int | * |  |  | 1,2,3,4 | 保留小数位数 | decimals |
| round | bool | * | 0,1 |  | 0,1 | 是否四舍五入 | round |

---


---

## frexp
desc: 分解浮点数为尾数和指数
desc_en: Split float into mantissa and exponent
type: function
proto: double frexp(double val, int &exp)
params: 2

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| val | double | * |  |  |  | 输入浮点数 | float |
| exp | int | * |  |  |  | 指数输出变量 | exp out |

---


---

## ldexp
desc: 装载浮点数 val × 2^exp
desc_en: Load float: val × 2^exp
type: function
proto: double ldexp(double val, int exp)
params: 2

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| val | double | * |  |  |  | 尾数 | mantissa |
| exp | int | * |  |  |  | 指数 | exp |

---


---

## cjoint
desc: 获取机器人当前各轴位置
desc_en: Get current joint positions
type: function
proto: joint cjoint()
params: 0

---


---

## cpose
desc: 获取机器人当前TCP位姿
desc_en: Get current TCP pose
type: function
proto: pose cpose(tool t, wobj w)
params: 2

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| t | tool | * |  |  | $FLANGE,$tool0,$tool1,$tool1 | 工具坐标系 | tool frame |
| w | wobj | * |  |  | $WORLD,$wobj0,$wobj1,$wobj2 | 工件坐标系 | work obj |

---


---

## getpose
desc: 运动学正解：由轴位置求TCP位姿
desc_en: Forward kinematics: joint → TCP pose
type: function
proto: pose getpose(joint j, tool t, wobj w)
params: 3

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| j | joint | * |  |  | j1 | 轴位置 | joint pos |
| t | tool | * |  |  | $FLANGE,$tool0,$tool1,$tool1 | 工具坐标系 | tool frame |
| w | wobj | * |  |  | $WORLD,$wobj0,$wobj1,$wobj2 | 工件坐标系 | work obj |

---


---

## getjoint
desc: 运动学逆解：由TCP位姿求轴位置
desc_en: Inverse kinematics: pose → joint
type: function
proto: joint getjoint(pose p, tool t, wobj w)
params: 3

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| p | pose | * |  |  |  | 目标位姿 | target pose |
| t | tool | * |  |  | $FLANGE,$tool0,$tool1,$tool1 | 工具坐标系 | tool frame |
| w | wobj | * |  |  | $WORLD,$wobj0,$wobj1,$wobj2 | 工件坐标系 | work obj |

---


---

## poseinv
desc: 求位姿逆变换
desc_en: Pose inverse transform
type: function
proto: pose poseinv(pose p)
params: 1

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| pose | pose | * |  |  | p1,[null] | 原始位姿 | pose |

---


---

## offset
desc: 位姿偏移（世界/工件坐标系下）
desc_en: Pose offset (world/wobj frame)
type: function
proto: pose offset(pose p, double dx, double dy, double dz, double rz, double ry, double rx)
params: 7

### variant: 缩短写法
### variant_en: Short form
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| pose | pose | * |  |  | p1 | 原始位姿 | pose |
| dx | double | * |  |  | 0 | X方向偏移 | dx |
| dy | double | * |  |  | 0 | Y方向偏移 | dy |
| dz | double | * |  |  | 0 | Z方向偏移 | dz |

### variant: 全称写法
### variant_en: Full form
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| pose | pose | * |  |  | p1 | 原始位姿 | pose |
| dx | double | * |  |  | 0 | X方向偏移 | dx |
| dy | double | * |  |  | 0 | Y方向偏移 | dy |
| dz | double | * |  |  | 0 | Z方向偏移 | dz |
| da | double | * |  |  | 0 | 绕X旋转 | rx |
| db | double | * |  |  | 0 | 绕Y旋转 | ry |
| dc | double | * |  |  | 0 | 绕Z旋转 | rz |

---


---

## reltool
desc: 工具坐标系下位姿偏移
desc_en: Pose offset in tool frame
type: function
proto: pose reltool(pose p, double dx, double dy, double dz, double rz, double ry, double rx)
params: 7

### variant: 全称写法
### variant_en: Full form
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| pose | pose | * |  |  | p1 | 原始位姿 | pose |
| dx | double | * |  |  | 0 | 工具X偏移 | tool dx |
| dy | double | * |  |  | 0 | 工具Y偏移 | tool dy |
| dz | double | * |  |  | 0 | 工具Z偏移 | tool dz |
| da | double | * |  |  | 0 | 绕工具X旋转 | tool rx |
| db | double | * |  |  | 0 | 绕工具Y旋转 | tool ry |
| dc | double | * |  |  | 0 | 绕工具Z旋转 | tool rz |

### variant: 缩短写法
### variant_en: Short form
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| pose | pose | * |  |  | p1 | 原始位姿 | pose |
| dx | double | * |  |  | 0 | 工具X偏移 | tool dx |
| dy | double | * |  |  | 0 | 工具Y偏移 | tool dy |
| dz | double | * |  |  | 0 | 工具Z偏移 | tool dz |

---


---

## cjttq
desc: 获取各轴输出力矩
desc_en: Get joint output torques
type: function
proto: jttq cjttq(int chan_no, bool Is_cmd)
params: 2

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| chan_no | int | * | 1~6 |  | 1,2,3 | 通道号 | channel |
| Is_cmd | bool | * | 0,1 |  | 0,1 | 是否指令值 | is cmd |

---


---

## cjtci
desc: 获取各轴电机电流
desc_en: Get joint motor currents
type: function
proto: jtci cjtci(int chan_no, bool Is_cmd)
params: 2

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| chan_no | int | * | 1~6 |  | 1,2,3 | 通道号 | channel |
| Is_cmd | bool | * | 0,1 |  | 0,1 | 是否指令值 | is cmd |

---


---

## channeltojoint
desc: 获取运行目标点的轴位置
desc_en: Get target point joint position
type: function
proto: joint channeltojoint(int chan_no)
params: 1

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| chan_no | int | * | 1~6 |  | 1,2,3 | 通道号 | channel |

---


---

## channeltopose
desc: 获取运行目标点的TCP位姿
desc_en: Get target point TCP pose
type: function
proto: pose channeltopose(int chan_no, tool t, wobj w)
params: 3

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| chan_no | int | * | 1~6 |  | 1,2,3 | 通道号 | channel |
| t | tool | * |  |  | $FLANGE,$tool0,$tool1,$tool1 | 工具坐标系 | tool frame |
| w | wobj | * |  |  | $WORLD,$wobj0,$wobj1,$wobj2 | 工件坐标系 | work obj |

---


---

## channeljoint
desc: 获取通道当前轴位置
desc_en: Get channel current joint position
type: function
proto: joint channeljoint(int chan_no, bool Is_cmd)
params: 2

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| chan_no | int | * | 1~6 |  | 1,2,3 | 通道号 | channel |
| Is_cmd | bool | * | 0,1 |  | 0,1 | 是否指令值 | is cmd |

---


---

## channelpose
desc: 获取通道当前TCP位姿
desc_en: Get channel current TCP pose
type: function
proto: pose channelpose(int chan_no, tool t, wobj w, bool Is_cmd)
params: 4

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| chan_no | int | * |  |  | 1,2,3 | 通道号 | channel |
| t | tool | * |  |  | $FLANGE,$tool0,$tool1,$tool1 | 工具坐标系 | tool frame |
| w | wobj | * |  |  | $WORLD,$wobj0,$wobj1,$wobj2 | 工件坐标系 | work obj |
| Is_cmd | bool | * | 0,1 |  | 0,1 | 是否指令值 | is cmd |

---


---

## channeljointvel
desc: 获取各轴当前速度
desc_en: Get joint current velocities
type: function
proto: jvel channeljointvel(int chan_no, bool Is_cmd)
params: 2

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| chan_no | int | * |  |  | 1,2,3 | 通道号 | channel |
| Is_cmd | bool | * | 0,1 |  | 0,1 | 是否指令值 | is cmd |

---


---

## channeltcpvel
desc: 获取当前TCP点速度
desc_en: Get current TCP speed
type: function
proto: double channeltcpvel(int chan_no, tool t, wobj w, bool Is_cmd)
params: 4

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| chan_no | int | * |  |  | 1,2,3 | 通道号 | channel |
| t | tool | * |  |  | $FLANGE,$tool0,$tool1,$tool1 | 工具坐标系 | tool frame |
| w | wobj | * |  |  | $WORLD,$wobj0,$wobj1,$wobj2 | 工件坐标系 | work obj |
| Is_cmd | bool | * | 0,1 |  | 0,1 | 是否指令值 | is cmd |

---


---

## ctcpforce
desc: 获取TCP点六维力矢量
desc_en: Get TCP 6D force vector
type: function
proto: tcpforce ctcpforce(int chan_no, tool t, wobj w)
params: 3

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| chan_no | int | * |  |  | 1,2,3 | 通道号 | channel |
| t | tool | * |  |  | $FLANGE,$tool0,$tool1,$tool1 | 工具坐标系 | tool frame |
| w | wobj | * |  |  | $WORLD,$wobj0,$wobj1,$wobj2 | 工件坐标系 | work obj |

---


---

## getposetool
desc: 根据ID获取工具位姿变量
desc_en: Get tool pose variable by ID
type: function
proto: pose getposetool(uint pose_index)
params: 1

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| pose_index | int | * |  |  | 0,1,2 | 位姿ID | pose idx |

---


---

## getposewobj
desc: 根据ID获取工件位姿变量
desc_en: Get wobj pose variable by ID
type: function
proto: pose getposewobj(uint pose_index)
params: 1

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| pose_index | int | * |  |  | 0,1,2,3 | 位姿ID | pose idx |

---


---

## setposetool
desc: 设置位姿变量的工具坐标系
desc_en: Set pose variable tool frame
type: function
proto: void setposetool(uint pose_index, uint tool_index)
params: 2

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| pose_index | int | * |  |  | 0,1,2,3 | 位姿ID | pose idx |
| tool_index | int | * |  |  | 0,1,2,3 | 工具ID | tool idx |

---


---

## setposewobj
desc: 设置位姿变量的工件坐标系
desc_en: Set pose variable work object
type: function
proto: void setposewobj(uint pose_index, uint wobj_index)
params: 2

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| pose_index | int | * |  |  | 0,1,2,3 | 位姿ID | pose idx |
| tool_index | int | * |  |  | 0,1,2,3 | 工具ID | tool idx |

---


---

## getwobj_3p
desc: 3点法标定工件坐标系
desc_en: 3-point work object calibration
type: function
proto: wobj getwobj_3p(joint j1, joint j2, joint j3, tool t)
params: 4

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| j1 | joint | * |  |  | j1 | 第1标定点轴位置 | joint1 |
| j2 | joint | * |  |  | j2 | 第2标定点轴位置 | joint2 |
| j3 | joint | * |  |  | j3 | 第3标定点轴位置 | joint3 |
| t | tool | * |  |  | $FLANGE,$tool0,$tool1,$tool2 | 工具坐标系 | tool frame |

---


---

## getwobj_indi
desc: 间接法标定工件坐标系
desc_en: Indirect work object calibration
type: function
proto: wobj getwobj_indi(joint j1, j2, j3, pos p1, p2, p3, tool t)
params: 7

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| j1 | joint | * |  |  | j1 | 第1点轴位置 | joint1 |
| j2 | joint | * |  |  | j2 | 第2点轴位置 | joint2 |
| j3 | joint | * |  |  | j3 | 第3点轴位置 | joint3 |
| p1 | pos | * |  |  | pos1 | 第1点测量坐标 | pos1 |
| p2 | pos | * |  |  | pos2 | 第2点测量坐标 | pos2 |
| p3 | pos | * |  |  | pos3 | 第3点测量坐标 | pos3 |
| t | tool | * |  |  | $FLANGE,$tool0,$tool1,$tool2 | 工具坐标系 | tool frame |

---


---

## getwobj_flange
desc: 法兰参照法标定工件坐标系
desc_en: Flange reference wobj calibration
type: function
proto: wobj getwobj_flange(joint j1, joint j2, tool t, bool xydefault)
params: 4

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| j1 | joint | * |  |  | j1 | 第1标定点 | point1 |
| j2 | joint | * |  |  | j2 | 第2标定点 | point2 |
| t | tool | * |  |  | $FLANGE,$tool0,$tool1,$tool2 | 工具坐标系 | tool frame |
| xydefault | bool | * | 0,1 |  | 0,1 | 是否使用默认XY方向 | use default XY |

---


---

## gettooltcp_ref
desc: 标准工具参照法标定TCP
desc_en: Reference tool TCP calibration
type: function
proto: void gettooltcp_ref(joint j1, joint j2, tool ref, tool& t)
params: 4

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| j1 | joint | * |  |  | j1 | 第1标定点 | point1 |
| j2 | joint | * |  |  | j1 | 第2标定点 | point2 |
| ref | tool | * |  |  | $FLANGE,$tool0,$tool1,$tool2 | 参照工具 | ref tool |
| t | tool | * |  |  | t1 | 待标定工具（输出） | tool out |

---


---

## gettoolrot_world
desc: 世界系参照法测量工具旋转
desc_en: World frame tool rotation measurement
type: function
proto: void gettoolrot_world(joint j, tool& t)
params: 2

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| j | joint | * |  |  | j1 | 标定点轴位置 | cal point |
| t | tool | * |  |  | t1 | 待标定工具（输出） | tool out |

---


---

## gettoolrot_3p
desc: 3点法测量工具旋转
desc_en: 3-point tool rotation measurement
type: function
proto: void gettoolrot_3p(joint j1, j2, j3, tool& t)
params: 4

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| j1 | joint | * |  |  | j1 | 第1标定点 | point1 |
| j2 | joint | * |  |  | j2 | 第2标定点 | point2 |
| j3 | joint | * |  |  | j3 | 第3标定点 | point3 |
| t | tool | * |  |  | t1 | 待标定工具（输出） | tool out |

---


---

## gettool_3p
desc: 3点法标定工具坐标系
desc_en: 3-point tool calibration
type: function
proto: tool gettool_3p(joint j1, joint j2, joint j3, wobj w)
params: 4

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| j1 | joint | * |  |  | j1 | 第1标定点 | point1 |
| j2 | joint | * |  |  | j2 | 第2标定点 | point2 |
| j3 | joint | * |  |  | j3 | 第3标定点 | point3 |
| w | wobj | * |  |  | $WORLD,$wobj0,$wobj1,$wobj2 | 工件坐标系 | work obj |

---


---

## getbase_3p
desc: 标定基础坐标系
desc_en: Base frame calibration
type: function
proto: void getbase_3p(joint j1, j2, j3, tool t, int index)
params: 5

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| j1 | joint | * |  |  | j1 | 第1标定点 | point1 |
| j2 | joint | * |  |  | j2 | 第2标定点 | point2 |
| j3 | joint | * |  |  | j3 | 第3标定点 | point3 |
| t | tool | * |  |  | $FLANGE,$tool0,$tool1,$tool2 | 工具坐标系 | tool frame |
| index | int | * |  |  | 0,1,2,3 | 基础坐标系索引 | base idx |

---


---

## strlen
desc: 字符串长度
desc_en: String length
type: function
proto: int strlen(string s)
params: 1

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| str | string | * |  |  |  | 输入字符串 | input str |

---


---

## substr
desc: 截取子字符串
desc_en: Extract substring
type: function
proto: string substr(string s, int startpos, int len)
params: 3

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| str | string | * |  |  | str1,$S[1] | 源字符串 | src str |
| start | int | * |  |  | 0,1,2,3 | 起始位置（0开始） | start(0-based) |
| len | int | * |  |  | 0,1,2,3 | 截取长度 | len |

---


---

## toint
desc: 转换成整型
desc_en: Convert to integer
type: function
proto: int toint(double d)/int toint(byte[] b, int start)/int toint(string s, int base)
params: 1~2

### variant: 浮点转整型
### variant_en: Float to int
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| d | double | * |  |  |  | 输入浮点数 | float |

### variant: 字节转整型
### variant_en: Bytes to int
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| data | byte[] | * |  |  |  | 输入浮点数 | float |
| start | int | * |  |  | 0,1,2,3 | 起始偏移地址 | start offset |

### variant: 字符串转整型
### variant_en: String to int
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| number_string | string | * |  |  |  | 输入字符串 | input str |
| number_base | base | * | dec,hex |  | dec,hex | 进制 | base |

---


---

## todouble
desc: 字节数组转浮点
desc_en: Byte array to float
type: function
proto: double todouble(byte[] data, int start)
params: 2

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| data | byte[] | * |  |  |  | 字节数组 | byte[] |
| start | int | * |  |  | 0,1,2,3 | 起始索引 | start idx |

---


---

## tobytes
desc: 将数据转换为字节数组
desc_en: Convert data to byte array
type: function
proto: void tobytes(src, byte[] dest, int start)
params: 3

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| src | any | * |  |  |  | 源数据 | src |
| dest | byte[] | * |  |  |  | 目标字节数组 | dest[] |
| start | int | * |  |  | 0,1,2,3 | 起始索引 | start idx |

---


---

## tostr
desc: 转换成字符串
desc_en: Convert to string
type: function
proto: string tostr(anytype v) 或 string tostr(double v, int precision)
params: 1~2

### variant: 基本转换
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| v | any | * |  |  |  | 输入值 | input |

### variant: 浮点指定精度
### variant_en: Float with precision
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| v | double | * |  |  |  | 输入浮点数 | float |
| precision | int | * | 0~15 |  | 2,3,4,0 | 小数位数 | precision |
| v | int | * |  |  |  | 输入整型 | integer |
| number_base | base | * | dec,hex |  | dec,hex | 小数位数 |  |

---


---

## ftobytes
desc: 浮点数转换成字节数组
desc_en: Float to byte array
type: function
proto: void ftobytes(double src, byte[] data, int start)
params: 3

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| src | double | * |  |  |  | 浮点数 | float value |
| data | byte[] | * |  |  |  | 目标字节数组 | dest[] |
| start | int | * |  |  | 0,1,2,3 | 起始索引 | start idx |

---


---

## tofloat
desc: 字节数组转换成浮点数
desc_en: Byte array to float
type: function
proto: double tofloat(byte[] data, int start)
params: 2

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| data | byte[] | * |  |  |  | 字节数组 | byte[] |
| start | int | * |  |  | 0,1,2,3 | 起始索引 | start idx |

---


---

## bitcheck
desc: 检查指定位是否为1
desc_en: Check if bit is 1
type: function
proto: bool bitcheck(int &data, int pos)
params: 2

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| data | int | * |  |  |  | 数据变量 | data var |
| pos | int | * | 0~31 |  | 0,1,2,3 | 位位置 | bit pos |

---


---

## bitset
desc: 将整数的指定位置1
desc_en: Set bit to 1
type: function
proto: void bitset(int &data, int pos)
params: 2

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| data | int | * |  |  |  | 数据变量 | data var |
| pos | int | * | 0~31 |  | 0,1,2,3 | 位位置 | bit pos |

---


---

## bitclear
desc: 将整数的指定位清0
desc_en: Clear bit to 0
type: function
proto: void bitclear(int &data, int pos)
params: 2

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| data | int | * |  |  |  | 数据变量 | data var |
| pos | int | * | 0~31 |  | 0,1,2,3 | 位位置 | bit pos |

---


---

## bitlcs
desc: 整数循环左移n位
desc_en: Circular left shift n bits
type: function
proto: int bitlcs(int data, int n)
params: 2

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| data | int | * |  |  |  | 数据 | data |
| n | int | * |  |  | 0,1,2,3 | 左移位数 | n bits |

---


---

## bitrcs
desc: 整数循环右移n位
desc_en: Circular right shift n bits
type: function
proto: int bitrcs(int data, int n)
params: 2

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| data | int | * |  |  |  | 数据 | data |
| n | int | * |  |  |  | 右移位数 | n bits |

---


---

## savearl
desc: 复制ARL文件
desc_en: Copy ARL file
type: function
proto: bool savearl(string file_src, string file_dst, bool mode)
params: 3

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| file_src | string | * |  |  | "script/new_folder1/demo1.arl" | 源文件路径 | src path |
| file_dst | string | * |  |  | "script/new_folder2/demo2.arl" | 目标文件路径 | dst path |
| mode | bool | * | 0,1 |  | 0,1 | 覆盖模式 | overwrite |

---


---

## savefilepose
desc: 保存位姿至数据文件
desc_en: Save pose to data file
type: function
proto: bool savefilepose(string file_name, string p_name, pose& p)
params: 3

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| file_name | string | * |  |  | "script/new_folder/demo_data.arl" | data文件路径 | data file path |
| p_name | string | * |  |  | p1 | 位姿变量名 | pose name |
| p | pose | * |  |  | p1 | 位姿变量 | pose var |

---


---

## savefilejoint
desc: 保存轴位置至数据文件
desc_en: Save joint to data file
type: function
proto: bool savefilejoint(string file_name, string j_name, joint& j)
params: 3

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| file_name | string | * |  |  | "script/new_folder/demo_data.arl" | 文件路径 | file path |
| j_name | string | * |  |  | j1 | 轴位置变量名 | joint name |
| j | joint | * |  |  | j1 | 轴位置变量 | joint var |

---


---

## filesize
desc: 查询文件大小（字节）
desc_en: Query file size (bytes)
type: function
proto: int filesize(string file_name)
params: 1

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| file_name | string | * |  |  | "script/new_folder/demo.arl" | 文件路径 | file path |

---


---

## renamefile
desc: 文件重命名
desc_en: Rename file
type: function
proto: bool renamefile(string old_name, string new_name)
params: 2

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| old_name | string | * |  |  |  | 原文件名 | old name |
| new_name | string | * |  |  |  | 新文件名 | new name |

---


---

## removefile
desc: 删除文件
desc_en: Delete file
type: function
proto: bool removefile(string file_name)
params: 1

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| file_name | string | * |  |  | "script/new_folder/demo.arl" | 文件路径 | file path |

---


---

## gettextstr
desc: 读取文本文件指定行内容
desc_en: Read specified line from text file
type: function
proto: string gettextstr(string path, int line, bool external)
params: 3

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| path | string | * |  |  | "script/new_folder/demo.arl" | 文件路径 | file path |
| line | int | * |  |  | 0,1,2,3 | 行号（0开始） | line(0-based) |
| external | bool | * | 0,1 |  | 0,1 | 是否外部路径 | external |

---


---

## saveposenow
desc: 立即保存当前位姿至文件
desc_en: Immediately save current pose to file
type: function
proto: bool saveposenow(uint channel, string file_name, ...)
params: 4

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| channel | int | * |  |  | 1,2,3 | 通道号 | channel |
| file_name | string | * |  |  | "script/new_folder/demo.arl" | 文件路径 | file path |

---


---

## savejointnow
desc: 立即保存当前轴位置至文件
desc_en: Immediately save current joint to file
type: function
proto: bool savejointnow(uint channel, string file_name, ...)
params: 4

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| channel | int | * |  |  | 1,2,3 | 通道号 | channel |
| file_name | string | * |  |  | "script/new_folder/demo.arl" | 文件路径 | file path |

---


---

## connect
desc: TCP Socket连接
desc_en: TCP Socket connect
type: function
proto: connect(host, port [, timeout])
params: 2~3

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| s | socket | * |  |  | skt1,s1 | 套接字变量 | socket variable |
| host | string | * |  |  | "192.168.1.2","192.168.2.2" | 目标IP地址 | host IP |
| port | int | * |  |  | 8888 | 端口号 | port |

---


---

## accept
desc: TCP Socket监听
desc_en: TCP Socket listen
type: function
proto: bool accept(socket s,string ip,int port)
params: 3

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| s | socket | * |  |  | skt1,s1 | 套接字变量 | socket variable |
| host | string | * |  |  | "192.168.1.1","192.168.2.1" | 本机IP地址 | local IP address |
| port | int | * |  |  | 8888 | 端口号 | port |

---


---

## write
desc: Socket写入数据
desc_en: Socket write
type: function
proto: write(s, data)
params: 2

### variant: 字符写法
### variant_en: String form
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| s | socket | * |  |  | skt1,s1 | Socket对象 | socket |
| data | string | * |  |  | senddata | 要发送的数据 | data |

### variant: 字节写法
### variant_en: Byte form
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| s | socket | * |  |  | skt1,s1 | Socket对象 | socket |
| data | byte[] | * |  |  | senddata | 要发送的字节组 | bytes to send |
| len | int | * |  |  | 1,2,3,4,5 | 字节组长度 | byte length |

---


---

## syncwrite
desc: 同步Socket写入
desc_en: Sync Socket write
type: function
proto: syncwrite(sock, data)
params: 2

### variant: 字符写法
### variant_en: String form
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| s | socket | * |  |  | skt1,s1 | Socket对象 | socket |
| data | string | * |  |  | senddata | 要发送的数据 | data |

### variant: 字节写法
### variant_en: Byte form
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| s | socket | * |  |  | skt1,s1 | Socket对象 | socket |
| data | byte[] | * |  |  | senddata | 要发送的字节组 | bytes to send |
| len | int | * |  |  | 1,2,3,4,5 | 字节组长度 | byte length |

---


---

## read
desc: Socket读取数据
desc_en: Socket read
type: function
proto: read(socket s,string data/byte[]data,int len)
params: 3

### variant: 字符写法
### variant_en: String form
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| s | socket | * |  |  | skt1,s1 | Socket对象 | socket |
| data | string | * |  |  | recdata | 存储字符串 | output string |
| len | int | * |  |  | 1,2,3,4,5 | 字符串长度 | string length |

### variant: 字节写法
### variant_en: Byte form
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| s | socket | * |  |  | skt1,s1 | Socket对象 | socket |
| data | byte[] | * |  |  | recdata | 存储字节组 | output bytes |
| len | int | * |  |  | 1,2,3,4,5 | 字节组长度 | byte length |

---


---

## readuntil
desc: 读取到分隔符
desc_en: Read until delimiter
type: function
proto: readuntil(socket s,string data,string cut)
params: 3

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| s | socket | * |  |  | skt1,s1 | Socket对象 | socket |
| data | string | * |  |  | recdata | 接收存储字符数据 | received string buffer |
| cut | string | * |  |  | "#" | 终止符 | delimiter |

---


---

## clearbuff
desc: 清空缓冲区
desc_en: Clear buffer
type: function
proto: clearbuff(socket_or_dev)
params: 1

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| socket_or_dev | any | * |  |  | skt1,s1 | Socket对象 | socket |

---


---

## open
desc: 打开modbus-RTU从站/主站设备
desc_en: Open Modbus RTU slave/master device
type: function
proto: bool open(modbus_dev dev, string devname, int slave_id, int baud_rate, int databits, StopBitType stop_bits,
params: 7

### variant: modbus-RTU从站设备,其他略
### variant_en: Modbus RTU slave device (others omitted)
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| dev | modbus_dev | * |  |  | m | modbus设备 | Modbus device |
| devname | string | * | "rtserMB0","/dev/ttyS0" |  | "rtserMB0","/dev/ttyS0" | 设备名 | device name |
| slave_id | int | * | 1~247 |  | 1,2,3 | 站号 | slave ID |
| baud_rate | int | * | 4800,9600,19200,38400,57600,115200 |  | 115200,4800,9600,19200,38400,57600 | 波特率 | baud rate |
| databits | int | * | 8 |  | 8 | 数据位 | data bits |
| stop_bits | StopBitType | * | 1,2 |  | 1,2 | 停止位类型 | stop bit type |
| parity | ParityType | * | none,odd,even |  | none,odd,even | 奇偶校验类型 | parity type |

---


---

## close
desc: 关闭Socket或串口
desc_en: Close Socket or serial port
type: function
proto: close(socket_or_dev)
params: 1

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| socket_or_dev | any | * |  |  | skt1,s1,dev1 | Socket或串口对象 | socket or serial object |

---


---

## dnwrite
desc: 向DeviceNet总线写数据
desc_en: Write to DeviceNet bus
type: function
proto: int dnwrite(int offset, int len, byte[] data)
params: 3

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| offset | int | * |  |  |  | 偏移地址 | offset |
| len | int | * |  |  |  | 数据长度 | data len |
| data | byte[] | * |  |  |  | 数据数组 | data[] |

---


---

## dnread
desc: 从DeviceNet总线读数据
desc_en: Read from DeviceNet bus
type: function
proto: int dnread(int offset, int len, byte[] data)
params: 3

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| offset | int | * |  |  |  | 偏移地址 | offset |
| len | int | * |  |  |  | 数据长度 | data len |
| data | byte[] | * |  |  |  | 接收数组 | data out |

---


---

## readregisters
desc: 读Modbus寄存器
desc_en: Read Modbus registers
type: function
proto: bool readregisters(data, int start, int len/int is_bigend)
params: 3

### variant: 整型/浮点读取
### variant_en: Integer/float read
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| data | double,int | * |  |  | recdata | 接收变量 | output variable |
| start | int | * |  |  | 0,1,2,3 | 起始寄存器地址 | start reg |
| is_bigend | int |  | 0,1 |  | 0,1 | 小端/大端 | little/big endian |

### variant: 字符/字节读取
### variant_en: String/byte read
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| data | string,byte[] | * |  |  | recdata | 接收变量 | output variable |
| start | int | * |  |  | 0,1,2,3 | 起始寄存器地址 | start reg |
| len | int | * |  |  | 2,4 | 读取长度 | read len |

---


---

## writeregisters
desc: 写Modbus寄存器
desc_en: Write Modbus registers
type: function
proto: bool writeregisters(int/double data, int start, int is_bigend)/ writeregisters(string/byte[] data, int start, int len)
params: 2~3

### variant: 整型写入
### variant_en: Integer write
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| data | int | * |  |  | senddata | 写入数据 | data |
| start | int | * |  |  | 0,1,2,3 | 起始寄存器地址 | start reg |
| is_bigend | int |  | 0,1 |  | 0,1 | 小端/大端 | little/big endian |

### variant: 浮点写入
### variant_en: Float write
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| data | double | * |  |  | senddata | 写入浮点数据 | float data to write |
| start | int | * |  |  | 0,1,2,3 | 起始寄存器地址 | start reg |

### variant: 字节写入
### variant_en: Byte write
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| data | byte[] | * |  |  | senddata | 写入字节数据 | bytes to write |
| start | int | * |  |  | 0,1,2,3 | 起始寄存器地址 | start reg |
| len | int | * |  |  | 2,4 | 写入长度 | write len |

### variant: 字符串写入
### variant_en: String write
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| data | string | * |  |  | senddata | 写入字符数据 | string data to write |
| start | int | * |  |  | 2,4 | 起始寄存器地址 | start reg |

---


---

## readcoils
desc: 读Modbus线圈状态
desc_en: Read Modbus coils
type: function
proto: bool readcoils(byte[], int start, int length)
params: 3

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| data | byte[] | * |  |  | recdata | 接收数组 | data out |
| start | int | * |  |  | 0,1,2,3 | 起始线圈地址 | start coil |
| length | int | * |  |  | 1,2,3,4 | 读取长度 | read len |

---


---

## writecoils
desc: 写Modbus线圈
desc_en: Write Modbus coils
type: function
proto: bool writecoils(byte[], int start, int length)
params: 3

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| data | byte[] | * |  |  | senddata | 写入数据 | data |
| start | int | * |  |  | 0,1,2,3 | 起始线圈地址 | start coil |
| length | int | * |  |  | 1,2,3,4 | 写入长度 | write len |

---


---

## clkstart
desc: 启动时钟计时
desc_en: Start clock
type: function
proto: void clkstart(clock &c)
params: 1

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| c | clock | * |  |  | c,c1,c2 | 时钟变量 | clock |

---


---

## clkstop
desc: 停止时钟计时
desc_en: Stop clock
type: function
proto: void clkstop(clock &c)
params: 1

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| c | clock | * |  |  | c,c1,c2 | 时钟变量 | clock |

---


---

## clkreset
desc: 时钟清零
desc_en: Reset clock
type: function
proto: void clkreset(clock &c)
params: 1

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| c | clock | * |  |  | c,c1,c2 | 时钟变量 | clock |

---


---

## clkread
desc: 读取时钟当前数值
desc_en: Read clock value
type: function
proto: double clkread(clock &c)
params: 1

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| c | clock | * |  |  | c,c1,c2 | 时钟变量 | clock |

---


---

# ═══ 特殊关键字 (Keywords) ═══

## void
desc: 表示函数无返回值的类型关键字
desc_en: Void return type keyword
type: keyword
proto: void
params: 0

---


---

## const
desc: 声明常量，值不可修改
desc_en: Declare constant (immutable)
type: keyword
proto: const <类型> <名称> = <值>
params: 0

---


---

## true
desc: 布尔量：真
desc_en: Boolean literal: true
type: keyword
proto: true
params: 0

---


---

## false
desc: 布尔量：假
desc_en: Boolean literal: false
type: keyword
proto: false
params: 0

---


---

## endl
desc: 换行符常量，用于 print 输出换行
desc_en: Newline constant for print
type: keyword
proto: endl
params: 0

---



---

## return
desc: 从函数返回，可携带返回值
desc_en: Return from function (optional value)
type: keyword
proto: return [表达式]
params: 1

### variant: 带返回值
### variant_en: With return
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| value | any | * |  |  |  | 返回值表达式 | return value |

---


---

## func
desc: 声明用户自定义函数
desc_en: Declare user-defined function
type: keyword
proto: func <返回类型> <函数名>(<参数列表>)
params: 0

---


---

## endfunc
desc: 结束函数定义块
desc_en: End function block
type: keyword
proto: endfunc
params: 0

---


---
# ═══ 数据类型 (Data Types) ═══

## int
desc: 整数类型
desc_en: integer type
type: datatype

---

## uint
desc: 无符号整数类型
desc_en: unsigned integer type
type: datatype

---

## byte
desc: 字节类型
desc_en: byte type
type: datatype

---

## double
desc: 浮点数类型
desc_en: Double-precision floating-point type
type: datatype

---

## bool
desc: 布尔类型（true/false）
desc_en: Boolean type (true/false)
type: datatype

---

## string
desc: 字符串类型
desc_en: String type
type: datatype

---

## pos
desc: 三维坐标类型
desc_en: 3D position type
type: datatype

---

## frame
desc: 坐标系类型
desc_en: Coordinate frame type
type: datatype

---

## pose
desc: 位姿类型（位置+姿态）
desc_en: pose type (position + orientation)
type: datatype

---

## joint
desc: 关节角度类型
desc_en: Joint angle type
type: datatype

---

## tool
desc: 工具坐标系类型
desc_en: Tool coordinate frame type
type: datatype

---

## wobj
desc: 工件坐标系类型
desc_en: Work object coordinate frame type
type: datatype

---

## weavedata
desc: 摆焊数据类型
desc_en: Weave data type
type: datatype

---

## speed
desc: 速度数据类型
desc_en: Speed data type
type: datatype

---

## slip
desc: 平滑过渡数据类型
desc_en: slip data type
type: datatype

---

## jvel
desc: 关节速度数据类型
desc_en: Joint velocity data type
type: datatype

---

## clock
desc: 时钟计时器类型
desc_en: Clock timer type
type: datatype

---

## iodev
desc: IO设备类型
desc_en: IO device type
type: datatype

---

## socket
desc: 套接字变量
desc_en: TCP Socket type
type: datatype

---

## melsec_dev
desc: 三菱PLC通信设备类型
desc_en: Mitsubishi PLC communication device type
type: datatype

---

## modbus_dev
desc: Modbus通信设备类型
desc_en: Modbus communication device type
type: datatype

---

## modbus_rtu_master
desc: Modbus RTU 主站设备类型
desc_en: Modbus RTU master device type
type: datatype

---

## tcpforce
desc: TCP六维力矢量类型
desc_en: TCP 6-axis force vector type
type: datatype

---

## jttq
desc: 关节力矩数据类型
desc_en: Joint torque data type
type: datatype

---

## jtci
desc: 关节电流数据类型
desc_en: Joint current data type
type: datatype

---

## compendata
desc: 补偿数据类型
desc_en: Compensation data type
type: datatype

---

# ═══ 系统变量 (System Variables) ═══

## $I
desc: 整数型系统变量数组（$I[index]）
desc_en: Integer system variable array
type: sysvar

---

## $I_NAME
desc: 整数型系统变量名称数组
desc_en: Integer system variable name array
type: sysvar

---

## $S
desc: 字符串型系统变量数组（$S[index]）
desc_en: String system variable array
type: sysvar

---

## $S_NAME
desc: 字符串型系统变量名称数组
desc_en: String system variable name array
type: sysvar

---

## $B
desc: 布尔型系统变量数组（$B[index]）
desc_en: Boolean system variable array
type: sysvar

---

## $B_NAME
desc: 布尔型系统变量名称数组
desc_en: Boolean system variable name array
type: sysvar

---

## $D
desc: 浮点型系统变量数组（$D[index]）
desc_en: Double system variable array
type: sysvar

---

## $D_NAME
desc: 浮点型系统变量名称数组
desc_en: Double system variable name array
type: sysvar

---

## $P
desc: 位姿型系统变量数组（$P[index]）
desc_en: Pose system variable array
type: sysvar

---

## $J
desc: 关节型系统变量数组（$J[index]）
desc_en: Joint system variable array
type: sysvar

---

## $TOOLS
desc: 工具坐标系数组
desc_en: Tool frame array
type: sysvar

---

## $TOOLS_NAME
desc: 工具坐标系名称数组
desc_en: Tool frame name array
type: sysvar

---

## $WOBJS
desc: 工件坐标系数组
desc_en: Work object frame array
type: sysvar

---

## $WOBJS_NAME
desc: 工件坐标系名称数组
desc_en: Work object frame name array
type: sysvar

---

## $BASE
desc: 基座坐标系数组
desc_en: Base coordinate frame array
type: sysvar

---

## $FLANGE
desc: 法兰坐标系
desc_en: Flange coordinate frame
type: sysvar

---

## $WORLD
desc: 世界坐标系
desc_en: World coordinate frame
type: sysvar

---

## $Config_check
desc: 轴配置检查使能
desc_en: Axis configuration check enable
type: sysvar

---

## $CCIR_ERROR_THRESHOLD
desc: ccir示教点不均匀报警阈值
desc_en: Alarm threshold for uneven ccir teaching points
type: sysvar

---

## $DFSPEED
desc: 默认速度参数
desc_en: Default speed parameter
type: sysvar

---

## $DFSLIP
desc: 默认平滑参数
desc_en: Default blending parameter
type: sysvar

---

## $DFTOOL
desc: 默认工具参数
desc_en: Default tool parameter
type: sysvar

---

## $DFWOBJ
desc: 默认工件坐标系参数
desc_en: Default work object frame parameter
type: sysvar

---

## $IGNORE_ORI
desc: 方向忽略使能
desc_en: Orientation ignore enable
type: sysvar

---

## $ORI_REF_PATH
desc: 圆弧方向参照路径坐标系
desc_en: Reference path coordinate system for arc orientation
type: sysvar

---

## $VEL_PROFILE
desc: 速度轮廓类型
desc_en: Velocity profile type
type: sysvar

---

## $TRAJ_ELAPSE_TIME
desc: 轨迹经过时间
desc_en: Elapsed trajectory time
type: sysvar

---

## $TRAJ_LEFT_TIME
desc: 轨迹剩余时间
desc_en: Remaining trajectory time
type: sysvar

---

## $TRAJ_ELAPSE_DIS
desc: 轨迹经过路程
desc_en: Elapsed trajectory distance
type: sysvar

---

## $TRAJ_LEFT_DIS
desc: 轨迹剩余路程
desc_en: Remaining trajectory distance
type: sysvar

---

## $CJOINT
desc: 当前轴位置点
desc_en: Current axis position point
type: sysvar

---

## $RPP_ENABLE
desc: RPP使能
desc_en: RPP enable
type: sysvar

---

## $AT_HOME
desc: 是否处于 HOME位置
desc_en: Whether at HOME position
type: sysvar

---

## $EXT_CTL_ACT
desc: 外部自动控制被激活
desc_en: External automatic control activated
type: sysvar

---

## $PGNO_REQ
desc: 请求程序号状态
desc_en: Program number request status
type: sysvar

---

## $PGNO
desc: 从外部获取的程序号
desc_en: Program number obtained externally
type: sysvar

---

## $PI
desc: 圆周率
desc_en: Pi
type: sysvar

---

## $CTL_MODE
desc: 当前控制模式
desc_en: Current control mode
type: sysvar

---

## $WOBJ_OFFSET
desc: 工件坐标系偏移
desc_en: Work object offset
type: sysvar

---

## $TOOL_OFFSET
desc: 工具坐标系偏移
desc_en: Tool offset
type: sysvar

---

## $RESET_POS_TYPE
desc: 上电时位置复位方式
desc_en: Position reset mode at power-on
type: sysvar

---

## $RESET_POS_THESHOLD
desc: 上电时位置复位判断门限
desc_en: Decision threshold for position reset at power-on
type: sysvar

---

## $WEAVE_FRAME_TYPE
desc: 叠加轨迹坐标系类型
desc_en: Superimposed trajectory coordinate system type
type: sysvar

---

## $EXT_CTL_ACT_DI
desc: 外部自动控制激活信号 DI 端口号
desc_en: DI port number for external automatic control activation signal
type: sysvar

---

## $SERVO_ON_DI
desc: 伺服上电信号 DI 端口号
desc_en: DI port number for servo-on signal
type: sysvar

---

## $SERVO_OFF_DI
desc: 伺服断电信号 DI 端口号
desc_en: DI port number for servo-off signal
type: sysvar

---

## $START_PROG_DI
desc: 启动程序信号 DI 端口号
desc_en: DI port number for start-program signal
type: sysvar

---

## $PAUSE_PROG_DI
desc: 暂停程序信号 DI 端口号
desc_en: DI port number for pause-program signal
type: sysvar

---

## $RESET_PROG_DI
desc: 复位程序信号 DI 端口号
desc_en: DI port number for reset-program signal
type: sysvar

---

## $CLEAR_ALARM_DI
desc: 清除报警信号 DI 端口号
desc_en: DI port number for clear-alarm signal
type: sysvar

---

## $PGNO_FBIT_DI
desc: 程序号第一位所在的 DI 端口号
desc_en: DI port number of the first program-number bit
type: sysvar

---

## $PGNO_PARITY_DI
desc: 奇偶校验信号 DI 端口号
desc_en: DI port number for parity signal
type: sysvar

---

## $PGNO_VALID_DI
desc: 程序号有效信号 DI 端口号
desc_en: DI port number for program-number valid signal
type: sysvar

---

## $EXT_CTL_CHAN_DI
desc: 外部控制通道选择起始位 DI 端口号
desc_en: DI port number of the start bit for external control channel selection
type: sysvar

---

## $EXT_CTL_ACT_CONF_DO
desc: 外部自动控制功能激活确认信号 DO 端口号
desc_en: DO port number for external automatic control activation confirmation signal
type: sysvar

---

## $SERVO_ON_DO
desc: 伺服上电信号 DO 端口号
desc_en: DO port number for servo-on signal
type: sysvar

---

## $PGNO_REQ_DO
desc: 请求程序号信号 DO 端口号
desc_en: DO port number for program-number request signal
type: sysvar

---

## $AT_HOME_DO
desc: 处于 HOME 点信号 DO 端口号
desc_en: DO port number for at-HOME signal
type: sysvar

---

## $AT_T1_DO
desc: 系统处于手动低速模式信号 DO 端口号
desc_en: DO port number for T1 mode signal
type: sysvar

---

## $AT_T2_DO
desc: 系统处于手动高速模式信号 DO 端口号
desc_en: DO port number for T2 mode signal
type: sysvar

---

## $AT_AUT_DO
desc: 系统处于自动模式信号 DO 端口号
desc_en: DO port number for automatic mode signal
type: sysvar

---

## $PGNO_ACK_FBIT_DO
desc: 程序号确认信号第一位所在的 DO 端口号
desc_en: DO port number of the first bit of the program-number acknowledgment signal
type: sysvar

---

## $CHAN_RUN_STATE_DO
desc: 各个通道处于自动程序运行状态 DO 端口号
desc_en: DO port number for automatic program running status of each channel
type: sysvar

---

## $CHAN_LOAD_STATE_DO
desc: 各个通道程序加载状态 DO 端口号
desc_en: DO port number for program loaded status of each channel
type: sysvar

---

## $CHAN_PAUSE_STATE_DO
desc: 各个通道程序暂停状态 DO 端口号
desc_en: DO port number for program paused status of each channel
type: sysvar

---

## $CHAN_STOP_STATE_DO
desc: 各个通道程序停止状态 DO 端口号
desc_en: DO port number for program stopped status of each channel
type: sysvar

---

## $CHAN_ESTOP_STATE_DO
desc: 各个通道程序急停状态 DO 端口号
desc_en: DO port number for emergency-stop status of each channel
type: sysvar

---

## $CHAN_IDLE_STATE_DO
desc: 前台通道处于空闲状态 DO 端口号
desc_en: DO port number for idle status of the foreground channel
type: sysvar

---

## $AT_PATH_DO
desc: 前台通道机器人处于轨迹上时 DO 端口号
desc_en: DO port number when the foreground-channel robot is on path
type: sysvar

---