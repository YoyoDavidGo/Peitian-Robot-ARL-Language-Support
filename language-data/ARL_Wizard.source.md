# ARL Language Metadata / Wizard MD V2.7

> 基于原 `ARL_Wizard(1).md`、官方《ARL 编程手册 V4.5.0（软件版本 2.6.6）》以及上传的高亮分类调整方案整理。
> 目标：同时服务于 Wizard、Hover、自动补全、语义高亮、参数向导、代码检查以及后续 AI 按需上下文注入。

schema_version: 2.7

arl_manual_version: V4.5.0

arl_software_version: 2.6.6

base_wizard_entries: 287

## V2.1 字段约定

- `type`：语言语义分类。固定分类为 `keyword / logic / datatype / builtin.constant / instruction / instruction.motion / function / sysvar`。
- 系统变量的 `type: sysvar` 只表示语义分类；`value_type` 单独记录变量或数组元素本身的 ARL 数据类型（如 `int`、`double`、`pose`、`tool`）。未命名的枚举使用 `enum`，不把变量名当作类型名。
- `is_constant: true`：系统变量中由手册明确称为常量的条目；不改变其 `type: sysvar`、`syntax: sysvar` 或系统变量高亮。
- 系统变量的 `shape: array` 表示数组；未写 `shape` 表示标量。手册给出固定长度时用 `array_length` 记录元素个数；未证实长度时不填写，不从名称推断。数组不再把 `[长度]` 拼进 `value_type`。
- 例如 `$I` 为 `type: sysvar`、`value_type: int`、`shape: array`、`array_length: 1000`；`$PI` 为 `type: sysvar`、`value_type: double`，未写 `shape`。
- `syntax`：语法形态，如 `call / statement / block / branch / terminator / type / constant / sysvar / modifier`。`type` 负责语义分类，`syntax` 负责表达形式；系统变量两者恰好都写作 `sysvar`，含义仍不同。
- `signature`：推荐的规范语法/函数签名；原 Wizard 的 `proto` 内容迁移到该字段。
- 参数数量不再使用独立 `params` 字段维护；由各 `variant` 的参数表以及“必填”列直接推导，避免重复数据源。
- `returns`：函数返回类型。若官方手册未明确且现有原型也无法确定，则明确标记 `[待核对]`。
- `return_constraint`：可选；仅在返回值存在明确范围/枚举约束时使用，例如 `getinterpercent()` 返回 `1~100`。
- `manual_ref`：官方手册位置，写作“§章节（manual p.印刷页码）”；手册 PDF 页码 = 印刷页码 + 18。
- 参数表收敛为 `参数 / 类型 / 必填 / 取值/约束 / 单位 / 候选项 / 说明 / desc_en` 八列。
- `必填` 列：`*` 为必填；留空为可省略；`-` 为可省略，并且参数向导等界面默认隐藏（可以用"显示全部参数"展开）。`-` 只影响界面：手写仍然合法，解析、校验、悬浮提示照常；AI 生成默认不用，除非用户要求。旧解析器只认 `*`，会把 `-` 当作可省略，不会出错。
- `wizard:`（向导预设）：后接表格 `预设 / preset_en / 变体 / 选用参数`，只影响参数向导等界面。
  - 行顺序就是向导里的显示顺序，第一行默认选中；向导只显示表中列出的预设，没列出的变体和组合仍然合法，选"显示全部"时可见。
  - `变体` 填 `### variant:` 的名称。
  - `选用参数`：变体有互斥组（choice_groups）时，每组选用哪个参数，逗号分隔；也可以写出 `-` 隐藏的参数，让它在这个预设里显示。留空时每组取参数表中排在前面的那个。
  - 没有 `wizard:` 的条目，向导按文件顺序显示全部变体。
  - 预设表只有 4 列，旧解析器会把它当成列数不够的参数行跳过，不会误读。
- `单位` 列：参数向导会把它追加在指令（非函数）参数的纯数字值后面（如 `vp:10%`）。所以指令参数只在 ARL 允许把单位直接写在数值后面时才填，目前确认的是 `%`、`mm`、`mm/s`；其他物理单位写在"说明"里。函数参数的单位列只作显示，不会追加。
- `取值/约束` 统一承载数值范围、枚举/可选值以及少量特殊合法值，避免拆成过多列。
- `候选项` 仅表示 Wizard/UI 可以展示的候选示例；当前源码中的动态变量候选应由符号表按参数类型推导，不在表格中额外显示“候选来源”。
- `members:` / `enum_members:`：正文中的字段标签，后接结构体成员表或枚举成员表；`enum_members` 是 Wizard 元数据名，手册称这些值为“成员”，不是 ARL 语法。
- `component_types:`：当手册中的成员标识符只是示例时，记录固定的组成类型与示例标识符，不把示例标识符作为固定成员名。
- `notes:`：条目级来源差异或核对说明，后接项目列表；这些字段标签不另占 Markdown 标题层级。
- 变体级 `returns` / `syntax`：分别覆盖条目级返回类型、标记特殊语法（如单行 `if` 的 `compact-if`、trigger 并行写法的 `parallel`）。零参数变体须保留空参数表。
- `choice_groups`：用 `|` 分隔一组互斥参数、用 `;` 分隔独立组；各组可再与其余可选参数组合，不表示组内参数同时出现。
- `positional`：逗号分隔的位置参数键，不生成 `键:` 前缀；`repeat_keys`：`键=最大次数`，`*` 表示无固定上限。
- `examples`：可选；保存官方手册可核对的最小 ARL 用法片段，不重复 `signature`，不存放完整工程程序。简单结束符、常量以及缺少可靠用法依据的条目不设此字段；可包含多行代码。
- `close` / `parent`：块结构条目的结束符 / 分支与结束符所属的起始块（如 `if` 的 `close: endif`，`else` 的 `parent: if`）。
- `kind`：数据类型条目的形态，`struct` 或 `enum`；基本类型不写。
- 运动指令（`type: instruction.motion`）都可以在末尾用分号追加并行指令，由类型本身表示，不另设字段；并行写法的参数只定义一处，见 trigger 条目的"并行写法"变体（`syntax: parallel`）。
- `range`：标量系统变量的取值范围，含义同参数表的"取值/约束"列。
- `classification_note`：条目分类（`type`）的依据说明。
- 未在官方手册中可靠定位的内容不会凭空补写，使用 `[待核对]` 或 `verification: needs-review` 标注。
- 官方手册未有的，实际系统内确实含有的，参考使用 manual_ref:Manually Added

## V2.1 相比 V2 的参数表调整

- 删除独立 `params` 字段：参数数量由 variant 参数表直接推导。
- 删除可见的 `默认值 / 建议值 / 候选来源` 三列。
- 将 `范围 / 枚举/选项 / 特殊值` 合并为单一的 `取值/约束`。
- 将原 V2 的“建议值”（来源于旧 Wizard 的候选项）恢复为更直观的 `候选项`。
- Metadata 字段之间增加空行，确保标准 Markdown 渲染时逐项分行显示。

## 分类与兼容行为组

| Semantic type | 兼容行为组 | 视觉策略（按上传分类方案） |
|---|---|---|
| keyword | S1 | 保持现有 keyword 颜色 |
| logic | S1 | 与 keyword 同色 |
| datatype | S1 | 新 datatype 色 |
| builtin.constant | S1 | 新 constant 色 |
| instruction | S2 | 保持现有 instruction 颜色 |
| instruction.motion | S2 | 与 instruction 同色 |
| function | S3 | 保持现有 function 颜色 |
| sysvar | BUILTIN_SVS | 保持现有 sysvar 颜色 |

## 数据来源与不确定性

- 官方手册是主要来源；用户对实际控制器行为的明确核实优先于与其冲突的手册陈述，并在对应条目标注。
- 原 Wizard 中的参数候选、英文说明等在本版中尽量保留；若官方手册没有直接对应字段，不把它们伪装成“已官方验证”。
- `$S` 是手册中误写为 `$STRING` 的实际变量名；`$S_NAME` 是与 `$S` 逐项对应的名称数组。两者均已由用户按实际控制器确认。
- 用户核实：`$I/$B/$D/$S/$J/$P` 均为 1000 个元素；`$I_NAME/$B_NAME/$D_NAME/$S_NAME/$J_NAME/$P_NAME` 是对应变量的名称数组，各有 1000 个字符串元素。手册表格中的 `[100]` 与实际控制器不符。`$PV1` 至 `$PV9` 为额外的 pose 数组，各有 1000 个元素；`$PV1_NAME` 至 `$PV9_NAME` 分别是同索引对应的字符串名称数组，各有 1000 个元素，其名称和长度由用户按实际控制器确认（手册未单列）。手册中的 HMI 映射表列出 `$P[0..999]` 及 `$PV1` 至 `$PV9`。
- `$STRING` 不再作为有效 ARL 系统变量条目保留；该名称仅作为官方手册命名错误的参考，不进入语言元数据词表。
- 官方手册中存在但原 Wizard 缺少的若干类型/函数，本版补入，包括 `Centroid_Pos / Inertia_Tensor / ToolInertiaPara / palletcompenpara / control / printto / num_base / stoptype / controlmode / stopbits / parity / weaveshape / weaverotaxis / P /T / S / StoEnd`。
- `palletcompen` 按官方手册 §5.12.18 从原 `instruction` 修正为 `function`。


## 用户确认的语言事实与手册勘误（汇总）

以下规则由用户按实际控制器确认，优先于手册中与之冲突的说法；相关条目另有标注。

- 指令参数的键名都可以省略，系统按参数表顺序和类型识别；参数值是 `{}` 结构体常量时也可以省略（手册 §3.1 说此时不能省略，与实际不符）。AI 生成代码时一律写键名。
- 结构体常量：成员名要么全写、要么全不写；写成员名时可以只给部分成员（如 `{j1 0,j4 30}`）；按位置写时可以只给前几个（如 `{1,1}`）；未赋值的成员为 `9e+09`。手册中只给部分成员的示例（如 `speed v = {per 10}`、`weavedata w = {2,15}`）都是合法写法。
- "加载（编译）通过"只代表语法正确；运行时才检查必要数据（如程序第一条运动指令须给全六轴）。
- ARL 标识符不区分大小写，如 `$TOOL0` 与 `$tool0`、`S_type` 与 `S_TYPE` 等价。
- `$TOOLS_NAME` / `$WOBJS_NAME` 的默认名称（tool0、tool1、tool2…，wobj0、wobj1…）可直接作为系统变量引用，如 `$tool0`、`$tool1`、`$wobj0`。
- 运动指令的平滑参数（s 的各成员、sp、sl）都是 double：0 表示不平滑（插补点不一定与目标点重合），负数（如 -1）表示准停（一定经过目标点），所以 `sp:-1%`、`sl:-1mm` 都合法；没有上限，给出的值超过这段路径允许的最大平滑量时，系统自动取最大可达值，不报错（如给 100mm、路径最多只能平滑 10mm，就按 10mm）。
- sp、sl 的值要带单位（`sp:5%`、`sl:10mm`）；不带单位不报错，但不规范。
- 枚举类型的成员可以直接写整数值，如控制器生成的程序中 `weave_type 0`、`axis 0`（手册 §2.6 也说明枚举是特殊整型）。
- weavedata 的成员名是 `weave_type`、`axis`（类型分别为 weaveshape、weaverotaxis）；手册 §2.4.8 成员表把类型名当成了成员名。成员顺序以控制器生成的程序为准：weave_type, frequency, amplitude, amplitude_left, amplitude_right, dwell_right, dwell_left, dwell_middle, track, vibrat, swing_angle, radius, axis, rotation_angle（写成员名时顺序不影响）。
- startcompen 的 `dataj` 类型是 `compendatajoint`（手册写作 compendata 有误），其成员 ej1~ej6 各含 max_vel、max_acc、max_jerk。
- writeregisters 写字符串只有 `(string data, int start)` 两个参数，手册示例 `writeregisters(s,200,2)` 多写了一个；`close(socket)` 没有返回值。
- socket 断线重连：`$DETECT_SOCK_CLOSE = true` 开启（bool 系统变量）；`geterror(socket)` 返回 int，1 为已断线、0 为未断线；`$ERR_SOCK_CLOSED` 是值为 1 的 double 常量系统变量。典型用法 `interrupt 1, when:geterror(s)==$ERR_SOCK_CLOSED, do:handler()`。
- int 与 double 可以直接比较，如 `int a=1`、`double b=1` 时 `a==b` 为 true。
- `$TOOL_INERTIA` 是控制器内部概念，编程不涉及，向导不收录。
- ARL 的标点符号一律为英文半角，只有字符串内部可以出现中文标点；语句中任意位置可以加空格，换行续写理论上可以但不鼓励。
- 并行写法：运动指令末尾用分号追加 `;触发事件,触发动作`，可追加多组，如 `lin p:p1,v:v1,s:s1,t:$FLANGE,w:$WORLD;P(0),setdo(1,1);P(50),sub_func()`。它是 trigger 的简化写法，效果等同在该指令前写 `trigger 10,when:事件,do:动作`（优先级固定为 10），只作用于本行运动（从上一目标点到本行目标点）。所有运动指令都支持。
- 触发事件（并行写法和 trigger 的 when）只用 T()、S()、StoEnd()、P()；普通 bool 表达式语法上能通过，但没有意义，不要使用。
- AI 生成偏好：轨迹触发优先用并行写法，少用 trigger；触发事件优先用 P()，T()、S()、StoEnd() 精度较差。
- `PI` 与 `$PI` 等效，两种写法都可用。
- `main` 是手册定义的程序入口函数（§1.6），每个程序须以 `func void main()` 实现，程序复位后从其第一行开始执行。
- 手册勘误：`$S` / `$S_NAME` 是手册 `$STRING` 的实际名称；jvel 的单位是 °/s（§2.4.11 写 rad/s 有误）；`$CTL_MODE` 的取值以 §2.6.5 controlmode 枚举为准（§10.2.21 写的 T1/T2/AUT 有误）；modf 示例中的 `double y` 应为 `int y`；weavedata 示例 `{2,15,1,1,0,true}` 类型不匹配，加载会报错，手册其余按位置写的摆动示例（§2.6.8、§2.6.9、§3.2.7）也与实际成员顺序不符；jttq 成员名是 jt1~jt6（成员表的 j1~j6 有误）；`$RESET_POS_TYPE` / `$RESET_POS_THESHOLD` 不是 [100] 数组。数组长度、accset 上限等其余勘误见上节和下节。
- 用户确认手册无误之处：`$CHAN_ESTOP_STATE_DO` 是 int 标量（不像同组变量是 int[12]）；`savesv("S")` 是正确用法。
- `waittime 0` 合法，常用于停止前瞻（手册 §3.4.1 参数表写"应大于0"，与手册其他章节的用法矛盾）。
- `assert` 条件不成立时只报警告（提示文件和行号），不退出程序；手册 §5.12.4 示例注释写"将退出"有误。
- switch 的表达式不限于 int（string 也可以）；case 后是常量表达式，可以是字面量或 const 变量（如先声明 `const string b1="b"`，再写 `case b1:`）。
- 所有运动指令的 vp 取值 0.001~100（%）；spl 的速度只有 v、vp 两种互斥写法。
- addslave 的 dev 是另行声明、不用 open 的 modbus_rtu_master 变量，addslave 把它绑定到新增从站，之后用它读写该从站（手册示例只有 `open(m,…)` 的 m 应为 m1）；Modbus RTU 主站设备名只用 "/dev/ttyS0"，手册主站示例中的 "rtserMB0"、"\dev\ttyS0" 有误；Modbus 的 StopBitType 取 1/2、ParityType 取 none/odd/even，取值以参数表为准。
- compendatajoint 各 ejN 的子成员 max_vel、max_acc、max_jerk 都是 double。
- 前期只支持六轴机器人、控制器 2.6.6 及以后版本。

## 2026-09-28 用户核实后的复核修订

- accset 的 acc、ramp 无最大上限；手册的 300% 上限与实际控制器不符。低值处理按手册说明保留。
- switcharl、switchbackarl 的 channel 使用 int，范围 1~6；实际控制器可以加载。
- offset、reltool 的四参数写法存在。P 函数的形式及参数以用户补充为准。
- print.to 使用 printto 类型，console 属于可选值但不是常用候选。
- 串口的 stopbits/parity 与 Modbus 原型的 StopBitType/ParityType 是不同类型，不作别名合并。
- ToolInertiaPara 的 Centroid_Pos/Inertia_Tensor 是固定类型；centroidpos/inertiatensor 与示例中的 centroid_pos/Inertia_Tensor 是成员标识符写法，不据此判定示例错误。
- writeregisters 按字符串、字节、浮点、整型、整型指定字节序区分为五种写法；close(socket) 经实际控制器确认可用。
- 多通道 setdo/syncdo 的限制是连续通道数不超过 32，即 1 ≤ to-from+1 ≤ 32，不是 val 的无符号数值上限。
- 暂不补充机器人适用范围。
- 变体级 returns/syntax 用于区分 rand 零参数返回值及 compact if。

## V2.7 修订记录

依据：逐条对照手册（审核记录见 ARL-IDE-Refactoring 仓库的 `docs/V2.6审核清单.md`）及用户 2026-09-29 的确认。

- 用户确认并写入：jvel 单位 °/s；`$CTL_MODE` 取值以 controlmode 枚举为准；modf 示例的 `y` 改为 `int`；ARL 不区分大小写；`$tool0` 为 `$TOOLS_NAME` 第一个默认名；`PI` 与 `$PI` 等效（新增 `PI` 常量条目）；`main` 为手册定义的官方入口函数。
- 释义按手册更正：ptp（各轴同时到达，不要求 TCP 轨迹形状）、ccir（连续圆弧，不是整圆）、jump（门形运动，仅 SCARA；a/b/Z/s/sig 含义）、break（适用 while/for/loop/repeat）、startmove.skip（跳过的轨迹条数）、saveposenow/savejointnow（写入传入的变量，不是"当前位姿"）、gettextstr（行号从 1 起，external_file 可省略）、substr.len 可省略、toascii（参数只能含 1 个字符）、getbase_3p.index（机械单元序号，从 1 起）、gettool_3p.w（已知参考点，只用 x/y/z）、startcompen.data/dataj（补偿过程的动态上限，dataj 针对外轴）、startdetect.cid（0~16，0 为手动 jog）、toolswitch.mu_name 可省略、init（只恢复 §10.2 功能类型系统变量）、pose.cfg/t4/t6、palletcompen/palletcompenpara（去掉"补偿"）、各标定函数的示教点含义。
- 运动指令：sp 恢复特殊值 -1（手册示例 `sp:-1%`）；dura 单位 s（第八批改为不带单位，写在说明里）；CA 单位 ° 并说明圆心角（第八批同样移到说明）；cir.m 为辅助点；jump 参数顺序按手册改为 a、b、Z、ctr、s、sig，补单位与缺省值。
- 补约束/单位/缺省值：waittime、waituntil、stopmove、velset.max、interrupt/timer 的 priority 与 interval、pulsedo、setao/syncao、read 字符串长度、Modbus RTU 主站读写上限、setip/getip 的 if_name。
- 通信：read/write/readuntil 补串口 iodev 变体（手册 §5.6.2.3）；更正 V2.6"readuntil 只有 socket 原型"的说法；readregisters/writeregisters 标明 ModbusTCP，writeregisters 章节号由 §5.6.6 改为 §5.6.4。
- 数据类型：tcpforce、jttq、jtci、compendata 补 `kind: struct` 和成员表；pose/joint/tool/slip/jvel 注明成员以六轴 §2.4 为准。
- 示例：cjoint/channeljoint 补 `waittime 0`；cpose/channelpose/channeltopose/cjttq/cjtci/ctcpforce 补手册中的 `ptp p`（cpose、channelpose 另补 `waittime 0`）；spl 补 `spl P:P6`；lin 恢复手册的 `sl:5mm`；bitset 补二进制后缀 `b`；modf 的 `y` 改为 `int`；enddetect 的 mu 加引号。
- 候选项：重复的 `$tool1,$tool1` 改为 `$tool1,$tool2`；文件类函数的候选去掉 `script/` 前缀（这些路径以 script 目录为根）；修正 goto、gettooltcp_ref、startweave 等候选笔误。
- 参数名与签名按手册统一：setdo/syncdo/getdo/getdi（value、from_chan、to_chan）、typeof(v)、assert(x)、gettextstr、renamefile；getintdo/getintdi、syncwrite、readuntil、getwobj_indi、gettoolrot_3p、getbase_3p、tobytes、substr 补全签名。
- manual_ref：58 条"PDF p.（自动定位）"全部改为"§章节（manual p.印刷页码）"（手册 PDF 页码 = 印刷页码 + 18），其中 connect/accept/read/write/readuntil/open/clearbuff/trigger 原先指错了页；cpose、poseinv、ftobytes 页码各差 1 页，已改。
- 恢复 `$CHAN_ESTOP_STATE_DO` 的待确认备注；`$RESET_POS_TYPE` / `$RESET_POS_THESHOLD` 加待确认备注。
- 字段约定补充 `close`、`parent`、`kind`、`range`、`classification_note` 的定义。

### 2026-09-29 第二批用户确认

- movej/ptp/lin/cir/ccir：`sl:-1` 合法，改为"特殊值：-1（准停）"并标 verification。（第八批补充：0 与负数含义不同，负数为准停；无上限）
- `$tool1`、`$tool2`、`$wobj0` 等与 `$tool0` 一样是默认名；在 `$TOOLS_NAME`、`$WOBJS_NAME` 中写明。
- weavedata：手册示例 `{2,15,1,1,0,true}` 类型不匹配、会报错，移出推荐示例并记为手册错误。
- jttq：成员名统一为 jt1~jt6，手册成员表的 j1~j6 记为错误。
- `$CHAN_ESTOP_STATE_DO`：确认手册的 int 标量正确，去掉待确认备注。
- `$RESET_POS_TYPE` / `$RESET_POS_THESHOLD`：确认不是 [100] 数组，改为标量；门限补 `range: 0~0.5`。
- savesv：确认 `savesv("S")` 为正确用法；候选补手册示例中的 "TOOLS"。

### 2026-09-29 第三批用户确认

- weavedata：成员名按控制器生成的程序改为 `weave_type`、`axis`；以该程序为推荐示例。
- 新增 `compendatajoint` 类型（外轴补偿动态上限），startcompen 的 dataj 类型由 compendata 改为 compendatajoint；compendata 成员名确认。
- writeregisters：字符串写入只有两个参数，手册三参数示例记为错误。
- close(socket)：返回类型确定为 void。

### 2026-09-29 第四批用户确认

- weavedata：成员顺序以控制器生成的程序为准，成员表已按其重排（dwell_right 在 dwell_left 前，vibrat 紧跟 track）。
- geterror 等 4 个未收录项、并行处理写法：保留在待确认清单，由用户后续补充。

### 2026-09-29 第五批用户确认

- 新增 geterror 函数、`$DETECT_SOCK_CLOSE`、`$ERR_SOCK_CLOSED` 系统变量（socket 断线重连）；`$TOOL_INERTIA` 仍待补充。
- 语言事实补充：int 与 double 可以直接比较。

### 2026-09-29 第六批用户确认

- weaveshape、weaverotaxis、startweave、endweave 的摆动示例改为写成员名的写法；手册按位置写的示例有误。
- compendata 补单位与取值范围，compendatajoint 补子成员范围与单位（依据用户提供的控制器界面截图）。
- `$TOOL_INERTIA` 是控制器内部概念，编程不涉及，不收录。

### 2026-09-29 第七批用户确认：并行写法

- 所有运动指令都支持并行写法，由 `type: instruction.motion` 表示，不另设字段；字段约定补充此规则。
- trigger 条目新增"并行写法"变体（`syntax: parallel`），示例改用手册 §7.2 的 P() 写法并加并行写法示例；when 限定为 T()/S()/StoEnd()/P()。
- P、T、S、StoEnd 补充生成偏好说明。
- 语言事实补充：标点一律半角、空格与换行、并行写法、触发事件限制、AI 生成偏好。

### 2026-09-29 第八批用户确认：平滑参数与单位

- movej、ptp、lin、cir、ccir 的 s/sp/sl 与 spl 的 sl：0 为不平滑，负数为准停（与手册一致）；没有上限，超出时系统自动取路径允许的最大值，不报错。候选改为 5、10、-1。slip 成员同样适用。
- sp、sl 须带单位（`%`、`mm`），写入取值/约束和语言事实。
- 明确"单位"列的用途：参数向导会把它追加在指令参数的纯数字值后面。原件就有的 dura 单位 `s`（会生成 `dura:10s`，用户确认 dura 不带单位），以及此前给 CA、jump 的 a/b/Z、waittime.time、waituntil.maxtime、velset.max、timer.interval、compen 的 x~c 补的单位（°、mm、s、mm/s）会被拼进代码，改写到"说明"里，单位列留空。

### 2026-09-29 第九批：另一 agent 复核意见整改

复核意见见 `docs/其他AI审核/v2.7agent审核意见以及我的部分回复.md`（F01–F17）。逐条对照手册核实后处理如下。

- 按手册更正或补全：syncdo 的"同步"是等信号输出后再继续，与运动无关（F01）；gettoolrot_world 补标定轴向 TOOL +X∥WORLD −Z、+Y∥+Y、+Z∥+X（F02，取自手册公式图）；$CJOINT 是上一条轨迹的目标点，不是实时位置（F03）；T() 按 100% 倍率计时、暂停急停后失效，trigger 补 §7.3 其余注意事项；interrupt.when 为边沿触发（F04）。
- 补约束：fmod.y≠0、trunc.n≥0、speed.per 0.001~100 及 tcp/ori 的机型上限、weavedata 三个 dwell 最小 0、$CCIR_ERROR_THRESHOLD 范围 0~0.5、interrupt/timer 的 name 指定时不能为空或重名（F06）。
- 签名：bitcheck/bitset/bitclear 顶层签名补 `&`；bitlcs/bitrcs 的 n 标为可选（F07）。savefilepose/savefilejoint 去掉易误解为输出参数的 `&`，名称参数候选加引号，savefilejoint 的 j_name 改回手册参数表的 joint_name（F17）。
- savefilepose/savefilejoint 注明"重新加载后生效"（F08）；Melsec 字符串 write 的 len 按参数表改为字符个数，并注明省略时为字符串长度（F09）。
- 用户确认：waittime 的 time 可为 0（F05）；assert 只报警告、不退出（F11）；jump.vp 为 0.001~100；switch 表达式不限于 int，case 可写 const 变量（F13）。
- 记录手册内部不一致：addslave 示例（F10）、getwobj_indi 参数表（F12）。
- 格式：rand 零参数变体补空参数表（F16）；compendata 示例页码改为 p.76（F17，已用 PDF 核对）。
- 未采纳：F17 说 `docs/V2.6审核清单.md` 不存在，是因为复核时看的是另一个 worktree，本仓库有该文件，只把引用写明为本仓库路径。F17 建议为 StopBitType/ParityType 补独立类型条目，但手册只提到 modbus_stopbits/modbus_parity 枚举而未给定义，补条目需要猜成员，列入待确认。
- "目前没有未决项"撤销，恢复待确认清单。

### 2026-09-29 第十批用户确认：第九批待确认项

- spl 与其他运动指令一样只有 v、vp 两种速度写法；所有运动指令（movej、ptp、lin、cir、ccir、spl、jump）的 vp 取值 0.001~100。
- addslave：dev 是另行声明、不用 open 的变量，代表新增从站；手册示例只有 `open(m,…)` 的 m 应为 m1。示例按手册恢复完整写法（同日曾误改为 addslave(m1,2)，已更正）。
- RTU 主站设备名只用 "/dev/ttyS0"；手册主站 write、addslave 示例的 "rtserMB0" 是复制漏改，close、read 示例的 "\dev\ttyS0" 是笔误。addslave 示例设备名已改。
- StopBitType/ParityType 的取值在手册参数表中已给全，不另建类型条目。
- compendatajoint 子成员都是 double。
- getwobj_indi：向导本来就按原型和示例写 pos；备注改为只记录 PDF 表 5-116 的原文，不再下"笔误"结论。

### 2026-09-30 第十一批：参数默认隐藏

- `必填` 列新增 `-`：可省略，参数向导等界面默认隐藏（用户提议，不增加列）。定义见文首字段约定。
- movej、ptp、lin、cir 的 dura 标 `-`：大多数程序用不到，默认不在向导中显示，避免误导。

### 2026-09-30 第十二批：向导预设

- 新增条目字段 `wizard:`（向导预设），用于指定、筛选、排序参数向导中的写法。定义见文首字段约定。
- 按用户要求，预设沿用 V2.4 原件的变体及其顺序：
  - movej：基本写法(v, s)、数字写法(vp, sl)
  - ptp：基本写法(v, s)、数字写法(vp, sl)
  - lin：基本写法(v, s)、数字写法(vl, sl)
  - cir：基本写法(v, s)、数字写法(vl, sl)
  - ccir：基本写法(v, s)、数字写法(vl, sl)
  - rand：浮点范围、无参数整数、整数范围
  - open：Modbus 从站设备、串口设备、Modbus RTU 主站设备、Melsec 从站设备
- movej、ptp、lin、cir、ccir 在 V2.6 合并成了一个带互斥组的"参数组合"变体，预设恢复为 V2.4 的两种写法；V2.4 以外的组合（如 movej 的 vp+sl）不单列，在向导里切换互斥组参数即可得到。
- rand、open 的变体比 V2.4 多，把 V2.4 的写法排在最前，其余按原顺序跟在后面，都显示。其他条目的变体顺序本来就与 V2.4 一致，不需要预设。
- dura 在预设中不写出，按 `-` 默认隐藏。
- movej、ptp 的第二个预设按用户要求改为"数字写法"（vp + sl），代替 V2.4 的"百分比速度"（vp + sp），与 lin、cir、ccir 的数字写法对应；不另加第三个预设。

### 2026-09-30 第十三批：变体命名

- 命名规则：平行的设备重载按设备（加数据类型）命名，与手册"通过 socket…""通过 melsec…"的分节对应；按参数区分的重载按区分点命名；两种写法平行时不叫"基本写法"。
- readuntil：基本写法 → Socket；Basic → Socket
- syncwrite：字符写法 → Socket 字符串；String form → Socket string
- syncwrite：字节写法 → Socket 字节数组；Byte form → Socket bytes
- write：Modbus slave 字符串 → Modbus 从站字符串
- write：Modbus slave 字节数组 → Modbus 从站字节数组
- write：Modbus RTU master 字符串 → Modbus RTU 主站字符串
- write：Modbus RTU master 字节数组 → Modbus RTU 主站字节数组
- read：Modbus slave 字符串 → Modbus 从站字符串
- read：Modbus slave 字节数组 → Modbus 从站字节数组
- read：Modbus RTU master 字符串 → Modbus RTU 主站字符串
- read：Modbus RTU master 字节数组 → Modbus RTU 主站字节数组
- clearbuff：串口 → Serial
- close：串口 → Serial
- clearbuff：Modbus 从站 → Modbus slave
- close：Modbus 从站 → Modbus slave
- close：Modbus RTU 主站 → Modbus RTU master
- getposetool：基本写法 → 按序号；Basic → By index
- getposewobj：基本写法 → 按序号；Basic → By index
- setposetool：基本写法 → 按序号；Basic → By index
- setposewobj：基本写法 → 按序号；Basic → By index
- trigger：基本写法 → 声明写法；Basic → Declaration
- tostr：基本转换 → 任意类型；Basic → Any type
- if：Basic → Block
- spl：速度数字写法 → 数字写法
- offset、reltool：变体统一为"位置"（四参数）在前、"位置+姿态"（七参数）在后；reltool 原来七参数在前（沿用 V2.4），按用户要求对调。
- open：串口设备、Modbus 从站设备、Modbus RTU 主站设备、Melsec 从站设备 → 串口、Modbus 从站、Modbus RTU 主站、Melsec，与 close 统一；预设表同步改名。

### 2026-09-30 第十四批：按用户指定补向导预设

- 原则（用户确认）：用户指定了的条目只显示指定的写法（其余写法仍合法，选"显示全部"可见）；没有指定的条目也写出预设，按当前顺序列出全部写法。
- trigger：只显示 声明写法（共 2 个写法）
- write：只显示 Socket 字符串、Socket 字节数组（共 10 个写法）
- read：只显示 Socket 字符串、Socket 字节数组（共 10 个写法）
- readuntil：只显示 Socket（共 2 个写法）
- clearbuff：只显示 Socket（共 3 个写法）
- close：只显示 Socket（共 5 个写法）
- 列出全部写法的（24 条）：if（块式写法、单行写法）；spl（基本写法、数字写法）；jump（基本写法、数字写法）；setdo（单通道、多通道）；syncdo（单通道、多通道）；getdo（单通道、多通道）；getdi（单通道、多通道）；abs（浮点绝对值、整型绝对值）；offset（位置、位置+姿态）；reltool（位置、位置+姿态）；getposetool（按序号、按名称）；getposewobj（按序号、按名称）；setposetool（按序号、按名称）；setposewobj（按序号、按名称）；toint（浮点转整型、字节转整型、字符串转整型）；tostr（任意类型、浮点指定精度、整型按进制）；bitcheck（整型、字节型）；bitset（整型、字节型）；bitclear（整型、字节型）；bitlcs（整型、字节型）；bitrcs（整型、字节型）；syncwrite（Socket 字符串、Socket 字节数组）；readregisters（整型读取、浮点读取、字符串读取、字节读取）；writeregisters（整型写入、浮点写入、字节写入、字符串写入）。

## 仍需控制器或官方勘误确认（V2.7 汇总）

目前没有未决项。

## V2.6 修订记录

- 结构体成员、枚举成员、组成类型及备注统一改为正文中的 `members:` / `enum_members:` / `component_types:` / `notes:` 字段标签，不再使用三级标题；枚举值与手册 §2.6、系统变量章节逐项核对。
- `slip` 的手册示例给出 6 个初始化值，而定义及成员表均为 5 个成员；移出推荐示例并记录手册内部不一致。
- 将 `print` 的常规/文件输出合为一个变体；`write` 的两个 Melsec 字符串变体以可选 `len` 合并；`writeregisters` 的两个整型变体以可选 `is_bigend` 合并。运动指令变体暂不调整。
- `return` 合并为一个变体，`value` 参数非必填，覆盖裸 `return` 和带表达式的 `return`。
- `$FLANGE`、`$WORLD`、`$PI` 保持 `type: sysvar` 和 `syntax: sysvar`，另以 `is_constant: true` 标记手册所称的常量。
- 按用户实际控制器核实，将 `$I/$B/$D/$S/$J/$P` 及已有的对应 `_NAME` 数组长度修正为 1000，并新增 `$J_NAME`、`$P_NAME`。
- 补入手册 HMI 映射表列出的 `$PV1`～`$PV9`，各为 1000 个 pose 元素；按用户补充，增加同索引对应的 `$PV1_NAME`～`$PV9_NAME` 字符串名称数组，各 1000 个元素。
- 按手册表题 `$BASE[]`、索引 0～2 和用户确认，将 `$BASE` 修正为 3 个 `wobj` 元素；`$CHAN_ESTOP_STATE_DO` 按手册的 `int` 保持为标量，删除无依据的待确认备注。
- 手册单项表中的 `[100]` 与其 HMI 映射表或实际控制器不一致；采用用户核实的实际长度，名称数组缺失之处标注用户确认来源。
- 当前仅校对源文档；应用内置版本及其读取 V2.5 的测试将在文档确认后同步。

## V2.5 修订记录

- 原 V2.5 修订以错误校对为主；本次复核新增变体级 returns/syntax 元数据，schema_version 升至 2.5。
- 修正依据：官方手册 V4.5.0（软件版本 2.6.6）的函数原型、指令格式和用法举例。

### 已修正

1. （46 条）：`examples` 原写在条目分隔线 `---` 之后，移回条目内（变体表之前）：repeat、loop、break、continue、pause、exit、restart、endcompen、getinterpercent、init、main、ctime、cdate、cjoint、const、func、pos、frame、pose、joint、tool、wobj、weavedata、speed、slip、jvel、Centroid_Pos、Inertia_Tensor、ToolInertiaPara、palletcompenpara、control、printto、num_base、stoptype、weaveshape、weaverotaxis、clock、iodev、socket、melsec_dev、modbus_dev、modbus_rtu_master、compendata、$VEL_PROFILE、$WOBJ_OFFSET、$TOOL_OFFSET
2. connect：签名改为手册原型 `bool connect(socket s, string ip, int port)`（原签名缺 `s`，且多出手册没有的 `timeout`）；参数 `host` 改名 `ip`
3. accept：参数 `host` 改名 `ip`，与签名和手册一致
4. setposewobj：第二个参数由错误的 `tool_index`（工具ID）改为手册的 `wobj_index`（工件坐标系ID）；类型 int 改为 uint 与签名一致；补手册中的"按名称"重载
5. getposetool：参数说明"位姿ID"改为手册的"工具ID"，类型改为 uint；补"按名称"重载
6. getposewobj：参数说明"位姿ID"改为手册的"工件ID"，类型改为 uint；补"按名称"重载
7. setposetool：类型 int 改为 uint 与签名一致；补"按名称"重载
8. syncdo：单通道输出值类型 int 改为 bool（手册 `void syncdo(int chan,bool value)`，与 setdo 一致）
9. setpwm：参数 freq、ratio 类型 double 改为 int（手册与签名均为 int）
10. tostr：原"浮点指定精度"变体把两个重载混成 4 个参数（含两个 `v`），拆为"浮点指定精度"和"整型按进制"；`number_base` 的说明由错误的"小数位数"改为"进制"，类型 `base` 改为已定义的枚举 `num_base`
11. toint：类型 `base` 改为已定义的枚举 `num_base`；"字节转整型"的 data 说明由错误的"输入浮点数"改为"输入字节数组"；顶层签名参数名与变体统一
12. open：顶层签名原为截断的半句，改为与示例一致的串口原型；补齐手册中的 4 个重载：串口设备、Modbus 从站设备（原有）、Modbus RTU 主站设备、Melsec 从站设备；描述相应改为"打开串口 / Modbus / Melsec 设备"
13. readregisters：原两个变体的签名格式错误（如 `readregisters(double,int data, ...)`），且 `is_bigend` 被错放到浮点读取；按手册 5 个原型整理为 4 个变体：整型（可选 is_bigend）、浮点、字符串、字节
14. writeregisters：顶层签名按手册整理（原签名写成 double/string 也带 is_bigend/len）；"字符串写入"的 start 候选值 2,4 改为 0,1,2,3
15. saveposenow：参数表缺手册中的 pose_name、p 两个必填参数（示例 `saveposenow(1,"prog1.arl","p1", a)` 就是 4 个参数），补齐并完整写出签名
16. savejointnow：参数表缺手册中的 pose_name、j 两个必填参数（示例 `savejointnow(1,"prog1.arl","j1", a)` 就是 4 个参数），补齐并完整写出签名
17. spl："速度数字写法"中 vp 的类型 speed 改为 double（百分比数值）
18. getdi：多通道读取的返回类型 bool 改为 int（手册 `int getdi(int from_chan,int to_chan)`）
19. getdo：多通道读取的返回类型 bool 改为 int（手册 `int getdo(int from_chan,int to_chan)`）
20. clearbuff：示例中 modbus open 的参数顺序错误（停止位与数据位颠倒，且应写 1），按手册改为 `open(m,"rtserMB0",1,115200,8,1,none)`
21. setcycle：示例中 modbus open 的参数顺序错误（停止位与数据位颠倒，且应写 1），按手册改为 `open(m,"rtserMB0",1,115200,8,1,none)`
22. rand：变体签名只保留本变体的原型；补手册中的整数范围重载 `double rand(int start, int end)`
23. compen：补手册中的外轴参数 ej1~ej6，签名写全
24. pulsedo：参数表名称与变体签名不一致，按签名（手册）统一：val→value
25. setao：参数表名称与变体签名不一致，按签名（手册）统一：val→value
26. syncao：参数表名称与变体签名不一致，按签名（手册）统一：val→value
27. sin：参数表名称与变体签名不一致，按签名（手册）统一：angle→x
28. cos：参数表名称与变体签名不一致，按签名（手册）统一：angle→x
29. tan：参数表名称与变体签名不一致，按签名（手册）统一：angle→x
30. pow：参数表名称与变体签名不一致，按签名（手册）统一：base→x，exp→y
31. pow10：参数表名称与变体签名不一致，按签名（手册）统一：n→x
32. poseinv：参数表名称与变体签名不一致，按签名（手册）统一：pose→p
33. strlen：参数表名称与变体签名不一致，按签名（手册）统一：str→s
34. substr：参数表名称与变体签名不一致，按签名（手册）统一：str→s，start→startpos
35. readcoils：签名第一个参数补上名称 data，与参数表一致
36. writecoils：签名第一个参数补上名称 data，与参数表一致

### 仍需控制器或官方勘误确认

已并入上文《仍需控制器或官方勘误确认（V2.7 汇总）》。

### 本次已处理的已知缺口

- 运动指令速度与平滑参数改用独立互斥组。
- print/scan 增加可重复位置参数，print 增加可选控制参数。
- read/write、clearbuff/close 增加手册支持的设备变体；readuntil 在本手册只找到 socket 原型。（V2.7 更正：手册 §5.6.2.3 说明 read/write/readuntil 同样用于串口 iodev，已补变体。）
- abs、bitcheck/bitset/bitclear/bitlcs/bitrcs、rand、getdo/getdi 改为对应的类型和变体返回值。
- interrupt/timer/trigger 的 do 确认为函数调用表达式；可调用系统或用户自定义函数。
- offset/reltool 四参数版本、P 函数形式按用户实际确认保留。

---

# ═══ 逻辑指令 (Logic) ═══

## if
desc: 条件判断；可用 endif 块式或单行紧凑写法

desc_en: Conditional block or single-line instruction

type: logic

syntax: block

close: endif

signature: if(bool 表达式)

manual_ref: ARL V4.5.0：manual p.99

examples:

```arl
int count = 1
if(count > 2)
    setdo(5,true)
elseif(count < 2)
    setdo(6,true)
else
    setdo(7,true)
endif
```

### variant: 块式写法
### variant_en: Block
signature: if(bool 表达式)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| cond | bool | * |  |  | getdi(1),$B[1] | 判断条件 | condition |

### variant: 单行写法
### variant_en: Compact
signature: if(bool 表达式) 指令
syntax: compact-if
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| cond | bool | * |  |  | getdi(1),$B[1] | 判断条件 | condition |
| statement | any | * |  |  | setdo(3,true) | 条件成立时执行的单行指令 | inline instruction |

wizard:

| 预设 | preset_en | 变体 | 选用参数 |
|---|---|---|---|
| 块式写法 | Block | 块式写法 |  |
| 单行写法 | Compact | 单行写法 |  |

---

## elseif
desc: 前一条件不满足时检查此条件

desc_en: Check this condition when previous is false

type: logic

syntax: branch

parent: if

signature: elseif(bool 表达式)

manual_ref: ARL V4.5.0：逻辑控制指令 / if（manual p.99）

### variant: 基本写法
### variant_en: Basic
signature: elseif(bool 表达式)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| cond | bool | * |  |  | getdi(1),$B[1] | 判断条件 | condition |

---

## else
desc: 所有 if/elseif 条件均不满足时的默认分支

desc_en: Default branch when all conditions false

type: logic

syntax: branch

parent: if

signature: else

manual_ref: ARL V4.5.0：逻辑控制指令 / if（manual p.99）

---

## endif
desc: 结束 if/elseif/else 条件块

desc_en: End if/elseif/else block

type: logic

syntax: terminator

parent: if

signature: endif

manual_ref: ARL V4.5.0：逻辑控制指令 / if（manual p.99）

---

## while
desc: 当条件成立时循环，先判断后执行

desc_en: While loop (check-first)

type: logic

syntax: block

close: endwhile

signature: while(bool 表达式)

manual_ref: ARL V4.5.0：manual p.100

examples:

```arl
int a = 0
while(a < 3)
    a++
endwhile
```

### variant: 基本写法
### variant_en: Basic
signature: while(bool 表达式)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| cond | bool | * |  |  | 1,0,getdi(1),$B[1] | 循环条件 | loop cond |

---

## endwhile
desc: 结束 while 循环块

desc_en: End while block

type: logic

syntax: terminator

parent: while

signature: endwhile

manual_ref: ARL V4.5.0：逻辑控制指令 / while（manual p.100）

---

## for
desc: 步进循环

desc_en: For loop

type: logic

syntax: block

close: endfor

signature: for(初始化; bool表达式; 迭代)

manual_ref: ARL V4.5.0：manual p.101

examples:

```arl
int b = 0
for(int i = 0;i < 5;i++)
    b++
endfor
```

### variant: 基本写法
### variant_en: Basic
signature: for(初始化; bool表达式; 迭代)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| init | string | * |  |  | int i1=0,i1=0 | 初始化语句 如 i=0 | init e.g. i=0 |
| cond | bool | * |  |  | i1<10 | 循环条件 如 i<10 | cond e.g. i<10 |
| iter | string | * |  |  | i1++ | 迭代语句 如 i=i+1 | iter e.g. i=i+1 |

---

## endfor
desc: 结束 for 循环块

desc_en: End for block

type: logic

syntax: terminator

parent: for

signature: endfor

manual_ref: ARL V4.5.0：逻辑控制指令 / for（manual p.101）

---

## repeat
desc: 直到型循环起始，先执行后判断

desc_en: Repeat-until loop (execute-first)

type: logic

syntax: block

close: until

signature: repeat

manual_ref: ARL V4.5.0：manual p.100


examples:

```arl
int a = 0
repeat
    a++
until(a >= 3)
```

---

## until
desc: 直到型循环结束条件，表达式为真时退出

desc_en: Until condition (exit when true)

type: logic

syntax: terminator

parent: repeat

signature: until(bool 表达式)

manual_ref: ARL V4.5.0：逻辑控制指令 / repeat（manual p.100）

### variant: 基本写法
### variant_en: Basic
signature: until(bool 表达式)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| cond | bool | * |  |  | getdi(1),$B[1] | 退出条件 | exit cond |

---

## loop
desc: 无限循环起始，需配合 break 退出

desc_en: Infinite loop (use break to exit)

type: logic

syntax: block

close: endloop

signature: loop

manual_ref: ARL V4.5.0：manual p.101


examples:

```arl
int a = 5
loop
    if(a-- == 0) break
endloop
```

---

## endloop
desc: 结束 loop 无限循环块

desc_en: End loop block

type: logic

syntax: terminator

parent: loop

signature: endloop

manual_ref: ARL V4.5.0：逻辑控制指令 / loop（manual p.101）

---

## switch
desc: 多分支判断，根据表达式值匹配 case

desc_en: Switch: multi-branch by expression value

type: logic

syntax: block

close: endswitch

signature: switch(表达式)

manual_ref: ARL V4.5.0：manual p.103

verification: confirmed-user-correction

examples:

```arl
switch(j)
case 0:
    i = 0
case 1:
    i = 1
default:
    i = -1
endswitch

// string 表达式，case 用 const 变量（用户提供）
string a = "a"
const string b1 = "b"
switch(a)
case b1:
    print "a"
default:
    print "b1"
endswitch
```

### variant: 基本写法
### variant_en: Basic
signature: switch(表达式)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| expr | any | * |  |  | i,n,m,$PGNO | 判断表达式，不限于 int（如 string） | expression (not limited to int) |

notes:

- 表达式不限于 int，string 也可以（用户确认，见示例第二段）；case 后是常量表达式，可以写字面量或 const 变量。
- 匹配到的 case 执行到下一个 case 前结束，然后跳到 endswitch 之后（手册 §4 switch）。

---

## case
desc: switch 的分支匹配项

desc_en: Switch case branch

type: logic

syntax: branch

parent: switch

signature: case 常量值:

manual_ref: ARL V4.5.0：逻辑控制指令 / switch（manual p.103）

verification: confirmed-user-correction

### variant: 基本写法
### variant_en: Basic
signature: case 常量值:
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| value | any | * | 常量表达式：字面量或 const 变量 |  | 0,1,2,3,4,5,6,7,8,9 | 匹配常量值，类型与 switch 表达式一致 | constant expression |

---

## default
desc: switch 无匹配 case 时的默认分支

desc_en: Default branch when no case matches

type: logic

syntax: branch

parent: switch

signature: default:

manual_ref: ARL V4.5.0：逻辑控制指令 / switch（manual p.103）

---

## endswitch
desc: 结束 switch 多分支块

desc_en: End switch block

type: logic

syntax: terminator

parent: switch

signature: endswitch

manual_ref: ARL V4.5.0：逻辑控制指令 / switch（manual p.103）

---

## break
desc: 跳出最近一层循环（while/for/loop/repeat）

desc_en: Break out of nearest loop

type: logic

syntax: statement

signature: break

manual_ref: ARL V4.5.0：manual p.102


examples:

```arl
while(1)
    if(counter == 5) break
    counter++
endwhile
```

---

## continue
desc: 跳过本次循环剩余代码，直接进入下一次循环

desc_en: Skip to next iteration

type: logic

syntax: statement

signature: continue

manual_ref: ARL V4.5.0：manual p.102


examples:

```arl
while(1)
    count++
    if(count == 1) continue
    break
endwhile
```

---

## goto
desc: 无条件跳转到指定标签处执行

desc_en: Unconditional jump to label

type: logic

syntax: statement

signature: goto label

manual_ref: ARL V4.5.0：manual p.104

examples:

```arl
next:
i++
if(i < 5) goto next
```

### variant: 基本写法
### variant_en: Basic
signature: goto label
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| label | string | * |  |  | label1 | 跳转目标标签名 | label |

---

## return
desc: 从函数返回，可携带返回值

desc_en: Return from function (optional value)

type: logic

syntax: statement

signature: return [表达式]

manual_ref: ARL V4.5.0：manual p.104

examples:

```arl
func int add(int x,int y)
    return x+y
endfunc
```

### variant: 返回
### variant_en: Return
signature: return [表达式]
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| value | any |  |  |  |  | 可选返回值表达式 | optional return value |

---

# ═══ 运动指令 (Motion Instructions) ═══

## movej
desc: 关节插补运动

desc_en: Joint interpolation move

type: instruction.motion

syntax: statement

signature: movej j:<joint>, [v:|vp:], [s:|sp:|sl:], [t:], [dura:]

manual_ref: ARL V4.5.0：§3.2.1（manual p.55）；§3.3.1（manual p.77）；平滑参数无上限、sp/sl 须带单位、vp 范围 0.001~100 由用户确认

verification: confirmed-user-correction

examples:

```arl
joint j1 = {j1 10,j2 20,j3 30,j4 40,j5 50,j6 60}
movej j:j1,vp:5%,sp:5%
```


### variant: 参数组合
### variant_en: Parameter choices
signature: movej j:<joint>, [v:|vp:], [s:|sp:|sl:], [t:], [dura:]
choice_groups: v|vp; s|sp|sl
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| j | joint | * |  |  | j1 | 目标关节位置 | target joint |
| v | speed |  |  |  | v1 | 速度 | speed |
| vp | double |  | 0.001~100 | % | 10 | 速度百分比 | speed % |
| s | slip |  |  |  | s1 | 平滑参数结构体；成员取值规则见 slip | blend |
| sp | double |  | 0 为不平滑，<0 为准停；无上限，超出时自动取路径允许的最大值；须带单位 % | % | 5,10,-1 | 平滑百分比 | blend % |
| sl | double |  | 0 为不平滑，<0 为准停；无上限，超出时自动取路径允许的最大值；须带单位 mm | mm | 5,10,-1 | 平滑距离 | blend distance |
| t | tool |  |  |  |  | 工具坐标系 | tool frame |
| dura | double | - |  |  |  | 指定轨迹时间（s），不带单位；填写时忽略速度参数 | trajectory duration; overrides speed |

wizard:

| 预设 | preset_en | 变体 | 选用参数 |
|---|---|---|---|
| 基本写法 | Basic | 参数组合 | v, s |
| 数字写法 | Numeric | 参数组合 | vp, sl |

---

## ptp
desc: 点到点运动（各轴同时到达目标位姿，不要求 TCP 轨迹形状）

desc_en: Point-to-point (all axes arrive together; TCP path not controlled)

type: instruction.motion

syntax: statement

signature: ptp p:<pose>, [v:|vp:], [s:|sl:|sp:], [t:], [w:], [dura:]

manual_ref: ARL V4.5.0：§3.2.2（manual p.56）；§3.3.2（manual p.78）；平滑参数无上限、sp/sl 须带单位、vp 范围 0.001~100 由用户确认

verification: confirmed-user-correction

examples:

```arl
pose p = {x 1500,y 500,z 500,a 0,b 90,c 0,cfg 0}
ptp p,dura:10
```


### variant: 参数组合
### variant_en: Parameter choices
signature: ptp p:<pose>, [v:|vp:], [s:|sl:|sp:], [t:], [w:], [dura:]
choice_groups: v|vp; s|sl|sp
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| p | pose | * |  |  | p1,[null] | 目标位姿 | target pose |
| v | speed |  |  |  | v1 | 速度 | speed |
| vp | double |  | 0.001~100 | % | 10 | 速度百分比 | speed % |
| s | slip |  |  |  | s1 | 平滑参数结构体；成员取值规则见 slip | blend |
| sl | double |  | 0 为不平滑，<0 为准停；无上限，超出时自动取路径允许的最大值；须带单位 mm | mm | 5,10,-1 | 平滑距离 | blend distance |
| sp | double |  | 0 为不平滑，<0 为准停；无上限，超出时自动取路径允许的最大值；须带单位 % | % | 5,10,-1 | 平滑百分比 | blend % |
| t | tool |  |  |  | $FLANGE,$tool0,$tool1,$tool2 | 工具坐标系 | tool frame |
| w | wobj |  |  |  | $WORLD,$wobj0,$wobj1,$wobj2 | 工件坐标系 | work obj |
| dura | double | - |  |  |  | 指定轨迹时间（s），不带单位；填写时忽略速度参数 | trajectory duration; overrides speed |

wizard:

| 预设 | preset_en | 变体 | 选用参数 |
|---|---|---|---|
| 基本写法 | Basic | 参数组合 | v, s |
| 数字写法 | Numeric | 参数组合 | vp, sl |

---

## lin
desc: 直线插补运动

desc_en: Linear interpolation move

type: instruction.motion

syntax: statement

signature: lin p:<pose>, [v:|vl:|vp:], [s:|sl:|sp:], [t:], [w:], [dura:]

manual_ref: ARL V4.5.0：§3.2.3（manual p.58）；§3.3.3（manual p.80）；平滑参数无上限、sp/sl 须带单位、vp 范围 0.001~100 由用户确认

verification: confirmed-user-correction

examples:

```arl
lin p:p1,vl:100mm/s,sl:5mm
```


### variant: 参数组合
### variant_en: Parameter choices
signature: lin p:<pose>, [v:|vl:|vp:], [s:|sl:|sp:], [t:], [w:], [dura:]
choice_groups: v|vl|vp; s|sl|sp
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| p | pose | * |  |  | p1,[null] | 目标位姿 | target pose |
| v | speed |  |  |  | v1 | 速度 | speed |
| vl | double |  |  | mm/s | 250 | 直线速度 | linear speed |
| vp | double |  | 0.001~100 | % | 10 | 速度百分比 | speed % |
| s | slip |  |  |  | s1 | 平滑参数结构体；成员取值规则见 slip | blend |
| sl | double |  | 0 为不平滑，<0 为准停；无上限，超出时自动取路径允许的最大值；须带单位 mm | mm | 5,10,-1 | 平滑距离 | blend distance |
| sp | double |  | 0 为不平滑，<0 为准停；无上限，超出时自动取路径允许的最大值；须带单位 % | % | 5,10,-1 | 平滑百分比 | blend % |
| t | tool |  |  |  | $FLANGE,$tool0,$tool1,$tool2 | 工具坐标系 | tool frame |
| w | wobj |  |  |  | $WORLD,$wobj0,$wobj1,$wobj2 | 工件坐标系 | work obj |
| dura | double | - |  |  |  | 指定轨迹时间（s），不带单位；填写时忽略速度参数 | trajectory duration; overrides speed |

wizard:

| 预设 | preset_en | 变体 | 选用参数 |
|---|---|---|---|
| 基本写法 | Basic | 参数组合 | v, s |
| 数字写法 | Numeric | 参数组合 | vl, sl |

---

## cir
desc: 圆弧插补运动

desc_en: Circular interpolation move

type: instruction.motion

syntax: statement

signature: cir m:<pose>, p:<pose>, [v:|vl:|vp:], [s:|sl:|sp:], [t:], [w:], [CA:], [dura:]

manual_ref: ARL V4.5.0：§3.2.5（manual p.62）；§3.3.4（manual p.82）；平滑参数无上限、sp/sl 须带单位、vp 范围 0.001~100 由用户确认

verification: confirmed-user-correction

examples:

```arl
cir p3,p4,tool1
```


### variant: 参数组合
### variant_en: Parameter choices
signature: cir m:<pose>, p:<pose>, [v:|vl:|vp:], [s:|sl:|sp:], [t:], [w:], [CA:], [dura:]
choice_groups: v|vl|vp; s|sl|sp
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| m | pose | * |  |  | p1,[null] | 圆弧辅助点；只使用 x/y/z | auxiliary point (x/y/z only) |
| p | pose | * |  |  | p2 | 终点位姿 | end pose |
| v | speed |  |  |  | v1 | 速度 | speed |
| vl | double |  |  | mm/s | 250 | 直线速度 | linear speed |
| vp | double |  | 0.001~100 | % | 10 | 速度百分比 | speed % |
| s | slip |  |  |  | s1 | 平滑参数结构体；成员取值规则见 slip | blend |
| sl | double |  | 0 为不平滑，<0 为准停；无上限，超出时自动取路径允许的最大值；须带单位 mm | mm | 5,10,-1 | 平滑距离 | blend distance |
| sp | double |  | 0 为不平滑，<0 为准停；无上限，超出时自动取路径允许的最大值；须带单位 % | % | 5,10,-1 | 平滑百分比 | blend % |
| t | tool |  |  |  | $FLANGE,$tool0,$tool1,$tool2 | 工具坐标系 | tool frame |
| w | wobj |  |  |  | $WORLD,$wobj0,$wobj1,$wobj2 | 工件坐标系 | work obj |
| CA | double |  |  |  |  | 圆心角（°）；指定后 p 只用于确定圆弧形状，终点按圆心角计算 | circle angle; p then only defines the arc |
| dura | double | - |  |  |  | 指定轨迹时间（s），不带单位；填写时忽略速度参数 | trajectory duration; overrides speed |

wizard:

| 预设 | preset_en | 变体 | 选用参数 |
|---|---|---|---|
| 基本写法 | Basic | 参数组合 | v, s |
| 数字写法 | Numeric | 参数组合 | vl, sl |

---

## ccir
desc: 连续圆弧运动（每条只示教一点，至少连续两条 ccir 确定圆弧）

desc_en: Continuous circular motion

type: instruction.motion

syntax: statement

signature: ccir p:<pose>, [v:|vl:|vp:], [s:|sl:|sp:], [t:], [w:]

manual_ref: ARL V4.5.0：§3.2.6（manual p.64）；平滑参数无上限、sp/sl 须带单位、vp 范围 0.001~100 由用户确认

verification: confirmed-user-correction

examples:

```arl
lin P:P1
lin P:P2
ccir P:P3
ccir P:P4
ccir P:P5
lin P:P6
```


### variant: 参数组合
### variant_en: Parameter choices
signature: ccir p:<pose>, [v:|vl:|vp:], [s:|sl:|sp:], [t:], [w:]
choice_groups: v|vl|vp; s|sl|sp
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| p | pose | * |  |  | p1,[null] | 目标位姿 | target pose |
| v | speed |  |  |  | v1 | 速度 | speed |
| vl | double |  |  | mm/s | 250 | 直线速度 | linear speed |
| vp | double |  | 0.001~100 | % | 10 | 速度百分比 | speed % |
| s | slip |  |  |  | s1 | 平滑参数结构体；成员取值规则见 slip | blend |
| sl | double |  | 0 为不平滑，<0 为准停；无上限，超出时自动取路径允许的最大值；须带单位 mm | mm | 5,10,-1 | 平滑距离 | blend distance |
| sp | double |  | 0 为不平滑，<0 为准停；无上限，超出时自动取路径允许的最大值；须带单位 % | % | 5,10,-1 | 平滑百分比 | blend % |
| t | tool |  |  |  | $FLANGE,$tool0,$tool1,$tool2 | 工具坐标系 | tool frame |
| w | wobj |  |  |  | $WORLD,$wobj0,$wobj1,$wobj2 | 工件坐标系 | work obj |

wizard:

| 预设 | preset_en | 变体 | 选用参数 |
|---|---|---|---|
| 基本写法 | Basic | 参数组合 | v, s |
| 数字写法 | Numeric | 参数组合 | vl, sl |

---

## spl
desc: 样条插补运动

desc_en: Spline interpolation move

type: instruction.motion

syntax: statement

signature: spl p:<pose>, [v:|vp:], [sl:], [t:], [w:]

manual_ref: ARL V4.5.0：§3.2.4（manual p.60）；§3.3.5（manual p.84）；vp 范围 0.001~100 由用户确认

verification: confirmed-user-correction

examples:

```arl
lin P:P1
lin P:P2
spl P:P3
spl P:P4
spl P:P5
spl P:P6
lin P:P7
```

### variant: 基本写法
### variant_en: Basic
signature: spl p:<pose>, [v:<speed>], [sl:<double>], [t:<tool>], [w:<wobj>]
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| p | pose | * |  |  | p1,[null] | 样条路径点位姿 | spline point |
| v | speed |  |  |  | v1 | 速度 | speed |
| sl | double |  | 0 为不平滑，<0 为准停；无上限，超出时自动取路径允许的最大值；须带单位 mm | mm | 10,-1 | 平滑距离 | blend dist |
| t | tool |  |  |  | $FLANGE,$tool0,$tool1,$tool2 | 工具坐标系 | tool frame |
| w | wobj |  |  |  | $WORLD,$wobj0,$wobj1,$wobj2 | 工件坐标系 | work obj |

### variant: 数字写法
### variant_en: Numeric
signature: spl p:<pose>, [vp:<double>], [sl:<double>], [t:<tool>], [w:<wobj>]
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| p | pose | * |  |  | p1,[null] | 样条路径点位姿 | spline point |
| vp | double |  | 0.001~100 | % | 10 | 百分比速度 | speed % |
| sl | double |  | 0 为不平滑，<0 为准停；无上限，超出时自动取路径允许的最大值；须带单位 mm | mm | 10,-1 | 平滑距离 | blend dist |
| t | tool |  |  |  | $FLANGE,$tool0,$tool1,$tool2 | 工具坐标系 | tool frame |
| w | wobj |  |  |  | $WORLD,$wobj0,$wobj1,$wobj2 | 工件坐标系 | work obj |

wizard:

| 预设 | preset_en | 变体 | 选用参数 |
|---|---|---|---|
| 基本写法 | Basic | 基本写法 |  |
| 数字写法 | Numeric | 数字写法 |  |

notes:

- 速度只有 v 与 vp 两种互斥写法（手册格式 `[v:|vp:]`），vp 与其他运动指令一样是百分比。手册 v 参数说明中"或速度绝对值参数 vl 代替"是从 lin 照抄的，spl 没有 vl。

---

## jump
desc: 门形运动（仅适用于 SCARA，对六轴无效）

desc_en: Gate (arch) motion, SCARA only

type: instruction.motion

syntax: statement

signature: jump p:<pose>, [v:|vp:], [t:], [w:], [a:], [b:], [Z:], [ctr:], [s:], [sig:]

manual_ref: ARL V4.5.0：§3.3.6（manual p.86）；vp 范围 0.001~100 由用户确认

verification: confirmed-user-correction

examples:

```arl
jump p:p1,vp:5%,t:$FLANGE,w:$WORLD,ctr:ctr1,s:false
```

### variant: 基本写法
### variant_en: Basic
signature: jump p:<pose>, [v:<speed>], [t:<tool>], [w:<wobj>], [a:<double>], [b:<double>], [Z:<double>], [ctr:<control>], [s:<bool>], [sig:<bool>]
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| p | pose | * |  |  | p1,[null] | 目标位姿 | target pose |
| v | speed |  |  |  | v1 | 速度 | speed |
| t | tool |  |  |  | $FLANGE,$tool0,$tool1,$tool2 | 工具坐标系 | tool frame |
| w | wobj |  |  |  | $WORLD,$wobj0,$wobj1,$wobj2 | 工件坐标系 | work obj |
| a | double |  | 缺省 25 |  | 50 | 从起点垂直上升的相对距离（mm） | vertical rise from start |
| b | double |  | 缺省 25 |  | 50 | 到达目标点前垂直下降的距离（mm） | vertical descent before target |
| Z | double |  | 缺省 0（最大限高） |  | -10 | Z 方向允许达到的最大绝对高度（mm） | max absolute Z height |
| ctr | control |  |  |  |  | 门型动作上升段、下降段的速度、加速度、减速度 | rising/falling speed and acceleration |
| s | bool |  | 缺省 false |  | true,false | 是否平滑：true 时不到达目标点，在降速前拐入下一条语句 | blend into next motion |
| sig | bool |  | 缺省 false |  |  | 下降前检查：为 true 则停在目标点正上方不下降，false 则到达目标点 | checked before descent; true stops above target |

### variant: 数字写法
### variant_en: Numeric
signature: jump p:<pose>, [vp:<double>], [t:<tool>], [w:<wobj>], [a:<double>], [b:<double>], [Z:<double>], [ctr:<control>], [s:<bool>], [sig:<bool>]
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| p | pose | * |  |  | p1,[null] | 目标位姿 | target pose |
| vp | double |  | 0.001~100 | % | 50 | 百分比速度 | speed % |
| t | tool |  |  |  | $FLANGE,$tool0,$tool1,$tool2 | 工具坐标系 | tool frame |
| w | wobj |  |  |  | $WORLD,$wobj0,$wobj1,$wobj2 | 工件坐标系 | work obj |
| a | double |  | 缺省 25 |  | 50 | 从起点垂直上升的相对距离（mm） | vertical rise from start |
| b | double |  | 缺省 25 |  | 50 | 到达目标点前垂直下降的距离（mm） | vertical descent before target |
| Z | double |  | 缺省 0（最大限高） |  | -10 | Z 方向允许达到的最大绝对高度（mm） | max absolute Z height |
| ctr | control |  |  |  |  | 门型动作上升段、下降段的速度、加速度、减速度 | rising/falling speed and acceleration |
| s | bool |  | 缺省 false |  | true,false | 是否平滑：true 时不到达目标点，在降速前拐入下一条语句 | blend into next motion |
| sig | bool |  | 缺省 false |  |  | 下降前检查：为 true 则停在目标点正上方不下降，false 则到达目标点 | checked before descent; true stops above target |

wizard:

| 预设 | preset_en | 变体 | 选用参数 |
|---|---|---|---|
| 基本写法 | Basic | 基本写法 |  |
| 数字写法 | Numeric | 数字写法 |  |

---

# ═══ 一般指令 (Instructions) ═══

## waittime
desc: 等待指定秒数

desc_en: Wait for specified seconds

type: instruction

syntax: statement

signature: waittime time:<double>

manual_ref: ARL V4.5.0：§3.4.1（manual p.88）；time 可为 0 由用户确认

verification: confirmed-user-correction

examples:

```arl
waittime time:5
```

### variant: 基本写法
### variant_en: Basic
signature: waittime time:<double>
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| time | double | * | >=0；0 用于停止前瞻 |  | 0.5,1,0.2,0 | 等待时间（s）；执行时暂停运动指令的提前规划 | wait time; stops motion look-ahead |

notes:

- `waittime 0` 合法（用户确认），常用于停止前瞻，如 cjoint/cpose 前、ccir 的注意事项。手册 §3.4.1 参数表写"应大于0"，与手册多处 `waittime 0` 的用法矛盾，以实际为准。

---

## waituntil
desc: 等待条件成立

desc_en: Wait until condition is true

type: instruction

syntax: statement

signature: waituntil cond:, [maxtime:], [timeoutflag:]

manual_ref: ARL V4.5.0：§3.4.2（manual p.88）

examples:

```arl
waituntil getdi(6),maxtime:5
```

### variant: 基本写法
### variant_en: Basic
signature: waituntil cond:, [maxtime:], [timeoutflag:]
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| cond | bool | * |  |  | getdi(1) | 等待条件表达式 | condition |
| maxtime | double |  | 缺省为无穷大 |  |  | 最长等待时间（s） | max wait |
| timeoutflag | bool |  | 须为 bool 变量；须同时指定 maxtime |  |  | 超时标志：true 表示超时 | timeout flag |

---

## stopmove
desc: 停止运动

desc_en: Stop motion

type: instruction

syntax: statement

signature: stopmove [type:]

manual_ref: ARL V4.5.0：§3.4.6（manual p.90）

examples:

```arl
func void inthandler1()
    stopmove fast
    waituntil getdi(6)
    startmove skip:1
endfunc
```

### variant: 基本写法
### variant_en: Basic
signature: stopmove [type:]
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| type | stoptype |  | general,fast；缺省 general |  | general,fast | 停止类型；fast 以 5 倍加速度停止 | stop type |

---

## startmove
desc: 启动运动

desc_en: Start motion

type: instruction

syntax: statement

signature: startmove [skip:]

manual_ref: ARL V4.5.0：§3.4.7（manual p.91）

examples:

```arl
func void inthandler1()
    stopmove fast
    waituntil getdi(6)
    startmove skip:1
endfunc
```

### variant: 基本写法
### variant_en: Basic
signature: startmove [skip:]
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| skip | int |  | >=0；缺省 0 |  | 0,1,2 | 重启后要跳过的轨迹条数：0 先回停止点再继续，1 直接去被中断轨迹的目标点 | trajectories to skip on restart |

---

## pause
desc: 暂停程序执行

desc_en: Pause program

type: instruction

syntax: statement

signature: pause

manual_ref: ARL V4.5.0：§3.4.3（manual p.89）


examples:

```arl
movej j:j1,vp:5%,sp:-1%
pause
movej j:j2,vp:5%,sp:-1%
```

---

## exit
desc: 退出当前程序

desc_en: Exit program

type: instruction

syntax: statement

signature: exit

manual_ref: ARL V4.5.0：§3.4.4（manual p.90）


examples:

```arl
if(getdi(6))
    exit
endif
```

---

## restart
desc: 重启程序

desc_en: Restart program

type: instruction

syntax: statement

signature: restart

manual_ref: ARL V4.5.0：§3.4.5（manual p.90）


examples:

```arl
movej j:{j1 10}
restart
```

---

## velset
desc: 速度调节，设置速度倍率和最大速度

desc_en: Speed adjustment: override & max speed

type: instruction

syntax: statement

signature: velset override:, max:

manual_ref: ARL V4.5.0：§3.5.4（manual p.94）

examples:

```arl
velset override:50,max:800
```

### variant: 基本写法
### variant_en: Basic
signature: velset override:, max:
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| override | int | * | 0~100 |  | 50,80 | 速度倍率百分比 | override % |
| max | int | * |  |  | 500,1000 | 编程规划最大 TCP 速度（mm/s） | max planned TCP speed |

---

## accset
desc: 加速度调节

desc_en: Acceleration adjustment

type: instruction

syntax: statement

signature: accset acc:, ramp:

manual_ref: ARL V4.5.0：§3.5.5（manual p.95）；上限采用用户核实的控制器行为，手册300%上限不适用

verification: confirmed-user-correction

examples:

```arl
accset acc:50,ramp:300
```

### variant: 基本写法
### variant_en: Basic
signature: accset acc:, ramp:
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| acc | double | * |  |  | 300,200,150 | 加速度百分比；低于20%按20%执行；实际控制器无上限 | acceleration %; below 20% uses 20%; no upper limit |
| ramp | double | * |  |  | 300,200,150 | 加加速度百分比；低于10%按10%执行；实际控制器无上限 | jerk %; below 10% uses 10%; no upper limit |

---

## interrupt
desc: 声明中断事件

desc_en: Declare interrupt event

type: instruction

syntax: statement

signature: interrupt [name:], [priority:], when:, do:

manual_ref: ARL V4.5.0：§6.1（manual p.221）

examples:

```arl
interrupt 1,when:getdi(6),do:setdo(1,true)
```

### variant: 基本写法
### variant_en: Basic
signature: interrupt [name:], [priority:], when:, do:
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| name | string |  | 指定时不能为空，也不能与已声明的中断重名 |  |  | 中断名称；可省略，缺省为空字符串 | int name; optional |
| priority | int |  | 0~255，0 最高；缺省 0 |  | 0,1,2 | 优先级 | priority |
| when | bool | * |  |  | getdi(1) | 中断事件；边沿触发：表达式由 false 变为 true 时触发 | event; edge-triggered on false→true |
| do | function | * |  |  |  | 函数调用表达式，可调用系统或用户自定义函数 | system or user function call |

notes:

- 手册 §6.3：中断为边沿触发，上一个中断扫描周期为 false、本周期为 true 时才算事件发生；表达式一直为 true 不会重复触发。

---

## timer
desc: 定时器中断

desc_en: Timer interrupt

type: instruction

syntax: statement

signature: timer [name:], [priority:], interval:, [rmode:], do:

manual_ref: ARL V4.5.0：§6.7（manual p.225）

examples:

```arl
timer name:"t1",priority:1,interval:1,rmode:true,do:setdo(1,true)
```

### variant: 基本写法
### variant_en: Basic
signature: timer [name:], [priority:], interval:, [rmode:], do:
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| name | string |  | 指定时不能为空，也不能与已声明的中断重名 |  |  | 定时器名称；可省略，缺省为空字符串 | timer name; optional |
| priority | int |  | 0~255，0 最高；缺省 0 |  | 0,1,2 | 优先级 | priority |
| interval | double | * | rmode 为 true 时 ≥0.001，为 false 时 ≥0 |  | 0.1,0.2,0.5,1 | 定时间隔（s） | interval |
| rmode | bool |  | 0,1 |  | 1,0 | 重复模式 | repeat mode |
| do | function | * |  |  |  | 函数调用表达式，可调用系统或用户自定义函数 | system or user function call |

---

## trigger
desc: 轨迹触发声明，作用于下一条运动指令；更常用的是运动指令后的并行写法

desc_en: Path trigger declaration for the next motion; the parallel clause is preferred

type: instruction

syntax: statement

signature: trigger [priority:], when:, do:

manual_ref: ARL V4.5.0：§7.1（manual p.227）；并行写法见 §7.4（manual p.229），细节由用户补充

verification: confirmed-user-correction

examples:

```arl
trigger 0,when:P(50),do:setdo(2,true)
lin p:p1,v:v1,s:s1,t:$FLANGE,w:$WORLD
// 并行写法（推荐）
movej j:j1,vp:5%,sl:0mm,t:$FLANGE
lin p:p1,v:v1,s:s1,t:$FLANGE,w:$WORLD;P(0),setdo(1,1);P(50),sub_func()
```

### variant: 声明写法
### variant_en: Declaration
signature: trigger [priority:], when:, do:
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| priority | int |  | 0~255 |  | 0,1,2,10 | 优先级，默认10 | priority; default 10 |
| when | bool | * | 只用 T()、S()、StoEnd()、P() |  | P(0),P(50),P(100) | 触发事件；推荐 P() | trigger event; P() preferred |
| do | function | * |  |  |  | 函数调用表达式，可调用系统或用户自定义函数 | system or user function call |

### variant: 并行写法
### variant_en: Parallel clause
signature: <运动指令>;<when>,<do>[;<when>,<do>…]
syntax: parallel
positional: when,do
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| when | bool | * | 只用 T()、S()、StoEnd()、P() |  | P(0),P(50),P(100) | 触发事件，同 trigger 的 when；推荐 P() | trigger event; P() preferred |
| do | function | * |  |  | setdo(1,true) | 触发动作，同 trigger 的 do：系统或用户函数调用 | function call |

wizard:

| 预设 | preset_en | 变体 | 选用参数 |
|---|---|---|---|
| 声明写法 | Declaration | 声明写法 |  |

notes:

- 并行写法是 trigger 的简化形式：`lin p1;P(50),f()` 等同于在 lin 前写 `trigger 10,when:P(50),do:f()`。优先级固定为 10，不能指定；只作用于本行运动（从上一目标点到本行目标点）；每个分号后一组，可追加多组。
- 所有运动指令（`type: instruction.motion`）都可以带并行写法。
- 生成建议（用户说明）：轨迹触发优先用并行写法，少用 trigger；触发事件优先用 P()，T()、S()、StoEnd() 精度较差。
- when 只用 T()、S()、StoEnd()、P()；普通 bool 表达式语法上能通过，但没有意义，不要使用。
- 手册 §7.3：ptp、movej 上用 S()、StoEnd() 不会触发；有平滑时，平滑段属于后一条轨迹；时间或距离参数不在 0 到轨迹总时间/总距离范围内时不触发；实际触发点可能有几毫秒或几毫米误差；T() 按 100% 倍率计时，暂停或急停后失效。
- 手册 §7.4 示例中的全角"，""；"是排版错误，ARL 标点一律半角。
- 解析提示：for 语句括号内也有分号；只有运动指令行上、括号外的分号才是并行分隔符。分号前后可以有空格。

---

## disableint
desc: 屏蔽中断；不带参数时屏蔽全部中断

desc_en: Disable interrupt

type: instruction

syntax: statement

signature: disableint [name:], [priority:]

manual_ref: ARL V4.5.0：§6.5（manual p.223）

examples:

```arl
disableint
enableint
```

### variant: 基本写法
### variant_en: Basic
signature: disableint [name:], [priority:]
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| name | string |  |  |  |  | 中断名称 | int name |
| priority | int |  | 0~255 |  | 0,1,2 | 优先级 | priority |

---

## enableint
desc: 使能中断；不带参数时使能全部中断

desc_en: Enable interrupt

type: instruction

syntax: statement

signature: enableint [name:], [priority:]

manual_ref: ARL V4.5.0：§6.5（manual p.223）

examples:

```arl
disableint
enableint
```

### variant: 基本写法
### variant_en: Basic
signature: enableint [name:], [priority:]
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| name | string |  |  |  |  | 中断名称 | int name |
| priority | int |  | 0~255 |  | 0,1,2 | 优先级 | priority |

---

## delint
desc: 删除中断；不带参数时删除全部中断

desc_en: Delete interrupt

type: instruction

syntax: statement

signature: delint [name:], [priority:]

manual_ref: ARL V4.5.0：§6.5（manual p.223）

### variant: 基本写法
### variant_en: Basic
signature: delint [name:], [priority:]
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| name | string |  |  |  |  | 中断名称 | int name |
| priority | int |  | 0~255 |  | 0,1,2 | 优先级 | priority |

---

## toolswitch
desc: 工具负载切换

desc_en: Tool load switch

type: instruction

syntax: statement

signature: toolswitch toolindex:<int>, [mu_name:<string>]

manual_ref: ARL V4.5.0：§3.5.6（manual p.95）

examples:

```arl
toolswitch toolindex:2
movej j:{j1 10,j2 20,j3 30,j4 40,j5 50,j6 60}
```

### variant: 基本写法
### variant_en: Basic
signature: toolswitch toolindex:<int>, [mu_name:<string>]
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| toolindex | int | * |  |  | 0 | 工具负载序号，对应 $TOOL_INERTIA[i] | tool load index |
| mu_name | string |  |  |  | "R1" | 切换负载的机械单元名称；可省略 | mech unit |

---

## startdetect
desc: 开启碰撞检测

desc_en: Enable collision detection

type: instruction

syntax: statement

signature: startdetect cid:<int>, mu:<string>

manual_ref: ARL V4.5.0：§3.5.7（manual p.96）

examples:

```arl
startdetect cid:1,mu:"R1"
```

### variant: 基本写法
### variant_en: Basic
signature: startdetect cid:<int>, mu:<string>
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| cid | int | * | 0~16 |  | 1 | 碰撞检测条件号：0 对应手动 jog，1~16 对应程序运行 | collision condition No. |
| mu | string | * |  |  | "R1" | 机械单元名称 | mech unit |

---

## enddetect
desc: 关闭碰撞检测

desc_en: Disable collision detection

type: instruction

syntax: statement

signature: enddetect mu:<string>

manual_ref: ARL V4.5.0：§3.5.8（manual p.96）

examples:

```arl
enddetect mu:"R1"
```

### variant: 基本写法
### variant_en: Basic
signature: enddetect mu:<string>
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| mu | string | * |  |  | "R1" | 机械单元名称 | mech unit |

---

## startweave
desc: 开启叠加摆动

desc_en: Enable weaving

type: instruction

syntax: statement

signature: startweave weave:weavedata, mu:"mu_name"

manual_ref: ARL V4.5.0：§3.2.7.1（manual p.69）

examples:

```arl
weavedata weave1 = {weave_type simple, frequency 2, amplitude 5}
startweave weave:weave1,mu:"R1"
lin p:{x 1000,y 500,z 500,a 0,b 90,c 0}
endweave mu:"R1"
```

### variant: 基本写法
### variant_en: Basic
signature: startweave weave:weavedata, mu:"mu_name"
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| weave | weavedata | * |  |  | weave1 | 摆动参数 | weave data |
| mu | string | * |  |  | "R1" | 机械单元名称 | mech unit |

notes:

- 手册 §3.2.7.1 示例 `startweave weavedata1={simple,10,15,0,45}, mu:" R1"` 按位置对应含义不符，已改为先声明 weavedata 再引用（用户确认手册按位置写的摆动示例有误）。

---

## endweave
desc: 结束叠加摆动

desc_en: End weaving

type: instruction

syntax: statement

signature: endweave mu:"mu_name"

manual_ref: ARL V4.5.0：§3.2.7.2（manual p.73）

examples:

```arl
startweave weave:weave1,mu:"R1"
lin p:{x 1000,y 500,z 500,a 0,b 90,c 0}
endweave mu:"R1"
```

### variant: 基本写法
### variant_en: Basic
signature: endweave mu:"mu_name"
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| mu | string | * |  |  | "R1" | 机械单元名称 | mech unit |

---

## startcompen
desc: 开始轨迹补偿

desc_en: Start path compensation

type: instruction

syntax: statement

signature: startcompen id:<int>, type:<enum>, data:<compendata>, dataj:<compendatajoint>

manual_ref: ARL V4.5.0：§3.2.11.1（manual p.74）；dataj 类型为 compendatajoint（手册写作 compendata 有误，用户确认）

verification: confirmed-user-correction

examples:

```arl
startcompen id:1,type:"TOOL",data:data3,dataj:dataj3
compen id:1,z:30
endcompen
```

### variant: 基本写法
### variant_en: Basic
signature: startcompen id:<int>, type:<enum>, data:<compendata>, dataj:<compendatajoint>
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| id | int | * |  |  | 1,2,3 | 补偿ID | compen ID |
| type | enum | * | "TOOL","WOBJ","TOOL_PATH","MODIFY_PATH","WORLD","EXJOINT" |  | "TOOL","WOBJ","TOOL_PATH","MODIFY_PATH","WORLD","EXJOINT" | 补偿参考坐标系；enum 为向导分类，手册未给出类型名 | compensation frame; enum is Wizard metadata |
| data | compendata | * |  |  | data1 | 机器人 TCP 补偿过程的最大速度、加速度、加加速度及姿态角速度、角加速度、角加加速度 | TCP compensation dynamic limits |
| dataj | compendatajoint | * |  |  | dataj1 | 外轴补偿过程的最大速度、加速度、加加速度 | external-axis compensation dynamic limits |

---

## endcompen
desc: 结束轨迹补偿

desc_en: End path compensation

type: instruction

syntax: statement

signature: endcompen

manual_ref: ARL V4.5.0：§3.2.11.3（manual p.76）


examples:

```arl
startcompen id:1,type:"TOOL",data:data3,dataj:dataj3
compen id:1,z:30
endcompen
```

---

## compen
desc: 设置轨迹补偿参数

desc_en: Set path compensation params

type: instruction

syntax: statement

signature: compen [id:], [x:], [y:], [z:], [a:], [b:], [c:], [ej1:], [ej2:], [ej3:], [ej4:], [ej5:], [ej6:]

manual_ref: ARL V4.5.0：§3.2.11.2（manual p.75）

examples:

```arl
startcompen id:1,type:"TOOL",data:data3,dataj:dataj3
compen id:1,z:30
endcompen
```

### variant: 基本写法
### variant_en: Basic
signature: compen [id:], [x:], [y:], [z:], [a:], [b:], [c:], [ej1:], [ej2:], [ej3:], [ej4:], [ej5:], [ej6:]
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| id | int |  |  |  | 1 | 序号,用于匹配 | index for matching |
| x | double |  |  |  | 0 | 沿参考坐标系 x 轴的平移补偿量（mm） | X offset |
| y | double |  |  |  | 0 | 沿参考坐标系 y 轴的平移补偿量（mm） | Y offset |
| z | double |  |  |  | 0 | 沿参考坐标系 z 轴的平移补偿量（mm） | Z offset |
| a | double |  |  |  | 0 | 欧拉角 a 分量补偿量（绕 z，°） | rotation offset about Z |
| b | double |  |  |  | 0 | 欧拉角 b 分量补偿量（绕 y，°） | rotation offset about Y |
| c | double |  |  |  | 0 | 欧拉角 c 分量补偿量（绕 x，°） | rotation offset about X |
| ej1 | double |  |  |  | 0 | 外轴1补偿量（直线轴 mm，旋转轴 度） | ext axis 1 offset |
| ej2 | double |  |  |  | 0 | 外轴2补偿量（直线轴 mm，旋转轴 度） | ext axis 2 offset |
| ej3 | double |  |  |  | 0 | 外轴3补偿量（直线轴 mm，旋转轴 度） | ext axis 3 offset |
| ej4 | double |  |  |  | 0 | 外轴4补偿量（直线轴 mm，旋转轴 度） | ext axis 4 offset |
| ej5 | double |  |  |  | 0 | 外轴5补偿量（直线轴 mm，旋转轴 度） | ext axis 5 offset |
| ej6 | double |  |  |  | 0 | 外轴6补偿量（直线轴 mm，旋转轴 度） | ext axis 6 offset |

---

## import
desc: 导入ARL模块

desc_en: Import ARL module

type: instruction

syntax: statement

signature: import modpath:<string>

manual_ref: ARL V4.5.0：§3.5.3（manual p.94）；示例见 §1.5 子程序（manual p.2），用法见 §8

examples:

```arl
import "/home/ae/.../SubProg.arl"
```

### variant: 基本写法
### variant_en: Basic
signature: import modpath:<string>
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| modpath | string | * |  |  | "a.arl" | arl 文件路径；与当前文件同目录时可只写文件名 | mod path |

---

## print
desc: 打印输出，支持多参数/文件输出/精度控制

desc_en: Print output (multi-arg / file / precision)

type: instruction

syntax: statement

signature: print [to:], [tostr:], [filepath:], [precision:], [numbase:], {argtoprint}

manual_ref: ARL V4.5.0：§3.5.1（manual p.91）；console 为合法取值但不列入常用候选（用户确认）

verification: confirmed-user-correction

examples:

```arl
print to:hmi,"hello world!"
```

### variant: 常规输出
### variant_en: Print
signature: print [to:], [tostr:], [filepath:], [precision:], [numbase:], {argtoprint}
positional: argtoprint
repeat_keys: to=4,argtoprint=*
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| to | printto |  | off,hmi,file,console |  | hmi,file,off | 输出方向；可指定最多4次，具有模态效果；`to:file` 表示输出到文件 | modal output target; repeat up to four times; file writes to a file |
| tostr | string |  | 需可写变量 |  |  | 输出字符串接收变量 | writable string output |
| filepath | string |  |  |  | "mylog/mylog.log" | 文件输出时可省略；未指定时为 /log/userlog/userlog | optional for file output; default /log/userlog/userlog |
| precision | int |  |  |  | 3,6 | double 输出的有效数字位数 | significant digits |
| numbase | num_base |  | hex,dec |  | hex,dec | int 输出的进制 | integer base |
| argtoprint | any | * |  |  |  | 要打印的表达式；可重复 | printable expression; repeatable |

---

## scan
desc: 扫描输入字符串，按分隔符解析至变量

desc_en: Scan string by delimiter to variables

type: instruction

syntax: statement

signature: scan from:<string>, delimiter:<string>, {argtosave}

manual_ref: ARL V4.5.0：§3.5.2（manual p.93）

examples:

```arl
double x,y,z
bool b
scan from:"1.1,1.2,1.3,true",delimiter:",",x,y,z,b
```

### variant: 基本写法
### variant_en: Basic
positional: argtosave
repeat_keys: argtosave=*
signature: scan from:<string>, delimiter:<string>, {argtosave}
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| from | string | * |  |  | recdata | 源字符串 | src str |
| delimiter | string | * |  |  | ",","#"," " | 分隔符 | delimiter |
| argtosave | any | * | int/double/bool/string 的可写变量 |  |  | 接收变量，可重复填写 | writable output variable; repeatable |

---

# ═══ 系统预定义函数 / 函数 (Functions) ═══

## palletcompen
desc: 计算垛盘中的码垛点

desc_en: Calculate a palletizing point

type: function

syntax: call

signature: pose palletcompen(palletcompenpara pallet, double X_offset, double Y_offset, pose P)

returns: pose

manual_ref: ARL V4.5.0：§5.12.18（manual p.217）

classification_note: 按官方手册 §5.12.18 归入 function。

examples:

```arl
pose palletpose=palletcompen(pallet1,80,20, $P[4])
```

### variant: 基本写法
### variant_en: Basic
signature: pose palletcompen(palletcompenpara pallet, double X_offset, double Y_offset, pose P)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| pallet | palletcompenpara | * |  |  | pallet1 | 码垛参数 | pallet |
| X_offset | double | * |  | mm | 50 | 码垛点沿 X 方向的偏移 | X offset |
| Y_offset | double | * |  | mm | 50 | 码垛点沿 Y 方向的偏移 | Y offset |
| P | pose | * |  |  | $P[4] | 码垛起始点 | start point |

---

## setinterpercent
desc: 设置机器人运行速度倍率

desc_en: Set robot speed override

type: function

syntax: call

signature: void setinterpercent(int per)

returns: void

manual_ref: ARL V4.5.0：§5.12.19（manual p.218）

verification: confirmed-user-correction

examples:

```arl
setinterpercent (5)
```

### variant: 基本写法
### variant_en: Basic
signature: void setinterpercent(int per)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| per | int | * | 0~100 |  | 30,50,80,100 | 速度倍率(%) | speed override (%) |

---

## getinterpercent
desc: 获取机器人当前运行速度倍率

desc_en: Get robot speed override

type: function

syntax: call

signature: int getinterpercent()

returns: int

return_constraint: 1~100

manual_ref: ARL V4.5.0：§5.12.20（manual p.218）

verification: confirmed-user-correction


examples:

```arl
getinterpercent ()
```

---

## setdo
desc: 设置数字量输出

desc_en: Set digital output

type: function

syntax: call

signature: void setdo(int chan, bool value) / void setdo(int from_chan, int to_chan, int value)

returns: void

manual_ref: ARL V4.5.0：§5.5.1（manual p.132）；§5.5.2（manual p.133）

verification: confirmed-user-correction

examples:

```arl
setdo(3,true)
setdo(10,41,0) // 从10到41，连续32路
```

### variant: 单通道
### variant_en: Single CH
signature: void setdo(int chan, bool value)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| chan | int | * |  |  | 1,2,3,4,5,6 | 通道号 | channel |
| value | bool | * | 0,1 |  | 1,0 | 输出值 | value |

### variant: 多通道
### variant_en: Multi CH
signature: void setdo(int from_chan, int to_chan, int value)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| from_chan | int | * |  |  | 1 | 起始通道 | from ch |
| to_chan | int | * | to_chan>=from_chan；to_chan-from_chan+1<=32 |  | 2 | 结束通道；与起始通道合计最多32路 | end channel; up to 32 consecutive outputs |
| value | int | * | 32位位模式 |  | 1 | 各通道对应的输出位 | output bit pattern |

wizard:

| 预设 | preset_en | 变体 | 选用参数 |
|---|---|---|---|
| 单通道 | Single CH | 单通道 |  |
| 多通道 | Multi CH | 多通道 |  |

---

## syncdo
desc: 同步输出数字量：确认 IO 端口信号已经输出后才继续执行程序

desc_en: Synchronous digital output; continues only after the signal is actually output

type: function

syntax: call

signature: void syncdo(int chan, bool value) / void syncdo(int from_chan, int to_chan, int value)

returns: void

manual_ref: ARL V4.5.0：§5.5.3（manual p.133）；§5.5.4（manual p.134）

verification: confirmed-user-correction

examples:

```arl
syncdo(3,true)
```

### variant: 单通道
### variant_en: Single CH
signature: void syncdo(int chan, bool value)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| chan | int | * |  |  | 1 | 通道号 | channel |
| value | bool | * | 0,1 |  | 1,0 | 输出值 | value |

### variant: 多通道
### variant_en: Multi CH
signature: void syncdo(int from_chan, int to_chan, int value)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| from_chan | int | * |  |  | 1 | 起始通道 | from ch |
| to_chan | int | * | to_chan>=from_chan；to_chan-from_chan+1<=32 |  | 2 | 结束通道；与起始通道合计最多32路 | end channel; up to 32 consecutive outputs |
| value | int | * | 32位位模式 |  | 1 | 各通道对应的输出位 | output bit pattern |

wizard:

| 预设 | preset_en | 变体 | 选用参数 |
|---|---|---|---|
| 单通道 | Single CH | 单通道 |  |
| 多通道 | Multi CH | 多通道 |  |

notes:

- 手册 §5.5.3～5.5.4："同步"指等信号实际输出后再往下执行（setdo 为异步，发出后立即继续），与运动轨迹无关。

---

## pulsedo
desc: 输出数字脉冲

desc_en: Output digital pulse

type: function

syntax: call

signature: void pulsedo(int chan, bool value, double width)

returns: void

manual_ref: ARL V4.5.0：§5.5.5（manual p.135）

examples:

```arl
pulsedo(5,true,0.2)
```

### variant: 基本写法
### variant_en: Basic
signature: void pulsedo(int chan, bool value, double width)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| chan | int | * |  |  | 1 | 通道号 | channel |
| value | bool | * | 0,1 |  | 1,0 | true 输出高脉冲，false 输出低脉冲 | pulse level |
| width | double | * | >=0；实际最小约 0.025 | s | 0.2,1 | 脉冲宽度 | width |

---

## setao
desc: 设置模拟量输出

desc_en: Set analog output

type: function

syntax: call

signature: void setao(int chan, double value)

returns: void

manual_ref: ARL V4.5.0：§5.5.11（manual p.139）

examples:

```arl
setao(2,5.2)
```

### variant: 基本写法
### variant_en: Basic
signature: void setao(int chan, double value)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| chan | int | * |  |  | 1,2,3,4,5,6 | 通道号 | channel |
| value | double | * | 电流型 4~20；电压型 -10~10 | mA/V | 5.2 | 输出值；单位取决于 AO 配置 | value |

---

## syncao
desc: 同步设置模拟量输出

desc_en: Sync set analog output

type: function

syntax: call

signature: void syncao(int chan, double value)

returns: void

manual_ref: ARL V4.5.0：§5.5.12（manual p.139）

examples:

```arl
syncao(2,5.2)
```

### variant: 基本写法
### variant_en: Basic
signature: void syncao(int chan, double value)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| chan | int | * |  |  | 1,2,3,4,5,6 | 通道号 | channel |
| value | double | * | 电流型 4~20；电压型 -10~10 | mA/V | 5.2 | 输出值；单位取决于 AO 配置 | value |

---

## setpwm
desc: 设置PWM输出

desc_en: Set PWM output

type: function

syntax: call

signature: bool setpwm(int channel, int freq, int ratio)

returns: bool

manual_ref: ARL V4.5.0：§5.5.16（manual p.142）

examples:

```arl
setpwm(1,20,50)
```

### variant: 基本写法
### variant_en: Basic
signature: bool setpwm(int channel, int freq, int ratio)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| channel | int | * | 1~3 |  | 1,2,3 | 通道号 | channel |
| freq | int | * | 10~1000 |  | 20,50,100 | 频率 Hz | freq Hz |
| ratio | int | * | 0~100 |  | 50 | 占空比 | duty % |

---

## getdo
desc: 读取数字量输出

desc_en: Read digital output

type: function

syntax: call

signature: bool getdo(int chan) 或 int getdo(int from_chan, int to_chan)

returns: bool 或 int（取决于参数个数）

manual_ref: ARL V4.5.0：§5.5.6（manual p.136）；§5.5.7（manual p.136）

examples:

```arl
int chan = 3
bool value = getdo(chan)
```

### variant: 单通道
### variant_en: Single CH
signature: bool getdo(int chan)
returns: bool
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| chan | int | * |  |  | 1 | 通道号 | channel |

### variant: 多通道
### variant_en: Multi CH
signature: int getdo(int from_chan, int to_chan)
returns: int
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| from_chan | int | * |  |  | 1 | 起始通道 | from ch |
| to_chan | int | * |  |  | 2 | 结束通道；from_chan<=to_chan，最多连续 32 路 | to ch |

wizard:

| 预设 | preset_en | 变体 | 选用参数 |
|---|---|---|---|
| 单通道 | Single CH | 单通道 |  |
| 多通道 | Multi CH | 多通道 |  |

---

## getdi
desc: 读取数字量输入

desc_en: Read digital input

type: function

syntax: call

signature: bool getdi(int chan) 或 int getdi(int from_chan, int to_chan)

returns: bool 或 int（取决于参数个数）

manual_ref: ARL V4.5.0：§5.5.8（manual p.137）；§5.5.9（manual p.138）

examples:

```arl
print getdi(4)
```

### variant: 单通道
### variant_en: Single CH
signature: bool getdi(int chan)
returns: bool
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| chan | int | * |  |  | 1 | 通道号 | channel |

### variant: 多通道
### variant_en: Multi CH
signature: int getdi(int from_chan, int to_chan)
returns: int
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| from_chan | int | * |  |  | 1 | 起始通道 | from ch |
| to_chan | int | * |  |  | 2 | 结束通道；from_chan<=to_chan，最多连续 32 路 | to ch |

wizard:

| 预设 | preset_en | 变体 | 选用参数 |
|---|---|---|---|
| 单通道 | Single CH | 单通道 |  |
| 多通道 | Multi CH | 多通道 |  |

---

## getai
desc: 读取模拟量输入

desc_en: Read analog input

type: function

syntax: call

signature: double getai(int chan)

returns: double

manual_ref: ARL V4.5.0：§5.5.10（manual p.138）

examples:

```arl
print getai(2)
```

### variant: 基本写法
### variant_en: Basic
signature: double getai(int chan)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| chan | int | * |  |  | 1 | 通道号 | channel |

---

## getao
desc: 读取模拟量输出

desc_en: Read analog output

type: function

syntax: call

signature: double getao(int chan)

returns: double

manual_ref: ARL V4.5.0：§5.5.13（manual p.140）

examples:

```arl
int chan = 1
double value = getao(chan)
```

### variant: 基本写法
### variant_en: Basic
signature: double getao(int chan)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| chan | int | * |  |  | 1 | 通道号 | channel |

---

## getintdo
desc: 读取单路 PLC_INT 模块的 DO 信号值

desc_en: Read one DO of a PLC_INT module

type: function

syntax: call

signature: bool getintdo(int chan)

returns: bool

manual_ref: ARL V4.5.0：§5.5.14（manual p.141）

examples:

```arl
bool value = getintdo(chan)
```

### variant: 基本写法
### variant_en: Basic
signature: bool getintdo(int chan)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| chan | int | * |  |  | 1 | 通道号 | channel |

---

## getintdi
desc: 读取单路 PLC_INT 模块的 DI 信号值

desc_en: Read one DI of a PLC_INT module

type: function

syntax: call

signature: bool getintdi(int chan)

returns: bool

manual_ref: ARL V4.5.0：§5.5.15（manual p.141）

examples:

```arl
bool value = getintdi(chan)
```

### variant: 基本写法
### variant_en: Basic
signature: bool getintdi(int chan)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| chan | int | * |  |  | 1 | 通道号 | channel |

---

## init
desc: 恢复功能类型系统变量（手册 §10.2）为默认值

desc_en: Reset functional system variables (§10.2) to defaults

type: function

syntax: call

signature: init()

returns: void

manual_ref: ARL V4.5.0：§5.12.6（manual p.210）


examples:

```arl
init()
```

---

## main
desc: 手册定义的程序入口函数，须以 func void main() 实现；程序复位后程序指针指向其第一行

desc_en: Entry function; pointer starts here after reset

type: function

syntax: call

signature: main()

returns: void

manual_ref: ARL V4.5.0：ARL 概述 / main 函数（manual p.2）


examples:

```arl
func void main()
    movej j:j1,vp:5%,sp:-1%
endfunc
```

---

## savesv
desc: 存储系统变量至配置文件

desc_en: Save system variable to config file

type: function

syntax: call

signature: void savesv(string svname)

returns: void

manual_ref: ARL V4.5.0：§5.12.5（manual p.210）

verification: confirmed-user-correction

examples:

```arl
savesv("TOOLS")
```

### variant: 基本写法
### variant_en: Basic
signature: void savesv(string svname)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| svname | string | * |  |  | "I","D","B","P","J","S","TOOLS" | 系统变量名（不带 $）；savesv("S") 为正确用法（用户确认） | sv name |

---

## typeof
desc: 返回变量类型字符串

desc_en: Return variable type as string

type: function

syntax: call

signature: string typeof(anytype v)

returns: string

manual_ref: ARL V4.5.0：§5.12.1（manual p.208）

examples:

```arl
double value =3.1415
print typeof(value)
```

### variant: 基本写法
### variant_en: Basic
signature: string typeof(anytype v)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| v | any | * |  |  |  | 任意类型的表达式 | any expression |

---

## ctime
desc: 返回当前时间字符串

desc_en: Return current time string

type: function

syntax: call

signature: ctime()

returns: string

manual_ref: ARL V4.5.0：§5.12.2（manual p.208）


examples:

```arl
print ctime()
```

---

## cdate
desc: 返回当前日期字符串

desc_en: Return current date string

type: function

syntax: call

signature: cdate()

returns: string

manual_ref: ARL V4.5.0：§5.12.3（manual p.209）


examples:

```arl
print cdate()
```

---

## assert
desc: 断言；条件为 false 时报警告，提示所在文件和行号，不退出程序

desc_en: Assert; raises a warning with file and line if false (does not stop the program)

type: function

syntax: call

signature: void assert(bool x)

returns: void

manual_ref: ARL V4.5.0：§5.12.4（manual p.209）

verification: confirmed-user-correction

examples:

```arl
int a = 6
assert(a == 5)
```

### variant: 基本写法
### variant_en: Basic
signature: void assert(bool x)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| x | bool | * |  |  | getdi(1),$B[1] | 被断言的 bool 表达式 | condition |

notes:

- 只报警告，不退出程序（用户确认）；手册 §5.12.4 示例注释"程序执行到这一行将退出，并报出错误"有误。

---

## toascii
desc: 获取单个字符的 ASCII 码值

desc_en: Get ASCII code of a single character

type: function

syntax: call

signature: int toascii(string s)

returns: int

manual_ref: ARL V4.5.0：§5.4.3（manual p.131）

examples:

```arl
print toascii("a")
```

### variant: 基本写法
### variant_en: Basic
signature: int toascii(string s)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| s | string | * | 只能包含 1 个字符 |  | "a" | 输入字符 | single character |

---

## setip
desc: 设置网口IP地址配置

desc_en: Set network interface IP config

type: function

syntax: call

signature: bool setip(string ip, string gate, string mask [, string if_name])

returns: bool

manual_ref: ARL V4.5.0：§5.6.1.1（manual p.143）

examples:

```arl
setip("10.20.210.93","10.20.210.254","255.255.255.0","eth1")
```

### variant: 基本写法
### variant_en: Basic
signature: bool setip(string ip, string gate, string mask [, string if_name])
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| ip | string | * |  |  | "192.168.1.1","192.168.2.1" | IP地址 | ip addr |
| gate | string | * |  |  | "192.168.1.111","192.168.2.111" | 网关 | gateway |
| mask | string | * |  |  | "255.255.255.0" | 子网掩码 | mask |
| if_name | string |  | "eth1","eth2","eth3"；缺省 eth1 |  | "eth1" | 网口名称；六轴控制柜只有 eth1，eth2/eth3 仅 SCARA 控制柜 | if name |

---

## getip
desc: 获取网口IP地址配置

desc_en: Get network interface IP config

type: function

syntax: call

signature: bool getip(string ip [, string if_name])

returns: bool

manual_ref: ARL V4.5.0：§5.6.1.2（manual p.143）

examples:

```arl
string ip
getip(ip,"eth2")
```

### variant: 基本写法
### variant_en: Basic
signature: bool getip(string ip [, string if_name])
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| ip | string | * |  |  | robot_ip | IP地址变量（输出，需可写变量） | ip var |
| if_name | string |  | "eth1","eth2","eth3"；缺省 eth1 |  | "eth1" | 网口名称；六轴控制柜只有 eth1，eth2/eth3 仅 SCARA 控制柜 | if name |

---

## addslave
desc: 配置Modbus一主多从从站

desc_en: Configure Modbus master-slave

type: function

syntax: call

signature: bool addslave(modbus_rtu_master dev, int slave_id)

returns: bool

manual_ref: ARL V4.5.0：§5.6.7.5（manual p.168）

examples:

```arl
modbus_rtu_master m1
modbus_rtu_master m2
bool open_ok1 = open(m1,"/dev/ttyS0",1,115200,8,1,none)
bool open_ok2 = addslave(m2,2)
bool write_ok1 = write(m1,"ABCD",0)
close(m1)
bool write_ok2 = write(m2,"DCBA",0)
close(m2)
```

### variant: 基本写法
### variant_en: Basic
signature: bool addslave(modbus_rtu_master dev, int slave_id)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| dev | modbus_rtu_master | * |  |  | m2 | 代表新增从站的设备变量：另行声明，不用 open；之后用它读写该从站 | device variable for the added slave (declared, not opened) |
| slave_id | int | * | 1~247 |  | 2,1,3 | 新增从站的站号 | slave ID |

notes:

- 用法（用户确认）：先用一个变量（m1）open 主站并连接第一个从站；再声明另一个变量（m2），用 addslave 绑定到新增从站，之后读写 m2 即访问该从站。手册 §5.6.7.5 示例只有 `open(m,…)` 的 m 是笔误，应为 m1，其余无误。
- 手册参数表把 dev 写成"已经打开的 modbus 设备"，与示例不符，以示例为准：dev 不需要 open。
- 主站设备名只用 "/dev/ttyS0"（用户确认，与 §5.6.7.1 参数表一致）。手册 addslave、write 主站示例的 "rtserMB0" 是从从站章节复制时漏改，close、read 示例的 "\dev\ttyS0" 是笔误。

---

## setcycle
desc: 设置Modbus通讯周期

desc_en: Set Modbus communication cycle

type: function

syntax: call

signature: void setcycle(modbus_dev& dev, int cycle)

returns: void

manual_ref: ARL V4.5.0：§5.6.6.6（manual p.165）

examples:

```arl
modbus_dev m
open(m,"rtserMB0",1,115200,8,1,none)
setcycle(m,1000000)
```

### variant: 基本写法
### variant_en: Basic
signature: void setcycle(modbus_dev& dev, int cycle)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| dev | modbus_dev | * |  |  | m_dev | Modbus设备 | modbus dev |
| cycle | int | * | >500000 | μs | 1000000,2000000,3000000 | 通讯周期us | communication cycle (us) |

---

## switcharl
desc: 从后台切换前台加载的ARL程序

desc_en: Switch foreground ARL program

type: function

syntax: call

signature: bool switcharl(int channel, string file_name)

returns: bool

manual_ref: ARL V4.5.0：§5.11.6（manual p.207）；channel 类型采用用户确认的控制器实际行为 int

verification: confirmed-user-correction

examples:

```arl
print switcharl(1,"Recipe1.arl")
```

### variant: 基本写法
### variant_en: Basic
signature: bool switcharl(int channel, string file_name)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| channel | int | * | 1~6 |  | 1,2,3 | 通道号 | channel |
| file_name | string | * |  |  | "Recipe1.arl" | 待加载的 arl 程序文件名 | ARL file |

---

## switchbackarl
desc: 从前台切换后台加载的ARL程序

desc_en: Switch background ARL program

type: function

syntax: call

signature: bool switchbackarl(int channel, string file_name)

returns: bool

manual_ref: ARL V4.5.0：§5.11.7（manual p.207）；channel 类型采用用户确认的控制器实际行为 int

verification: confirmed-user-correction

examples:

```arl
print switchbackarl(1,"Recipe1.arl")
```

### variant: 基本写法
### variant_en: Basic
signature: bool switchbackarl(int channel, string file_name)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| channel | int | * | 1~6 |  | 1,2,3 | 通道号 | channel |
| file_name | string | * |  |  | "Recipe1.arl" | 待加载的 arl 程序文件名 | ARL file |

---

## startbackchannel
desc: 启动指定的后台通道

desc_en: Start specified background channel

type: function

syntax: call

signature: void startbackchannel(int chan_no)

returns: void

manual_ref: ARL V4.5.0：§5.12.15（manual p.216）

examples:

```arl
startbackchannel(1)
```

### variant: 基本写法
### variant_en: Basic
signature: void startbackchannel(int chan_no)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| chan_no | int | * | 1~6 |  | 1,2,3 | 后台通道号 | bg channel |

---

## pausebackchannel
desc: 暂停指定的后台通道

desc_en: Pause specified background channel

type: function

syntax: call

signature: void pausebackchannel(int chan_no)

returns: void

manual_ref: ARL V4.5.0：§5.12.16（manual p.216）

examples:

```arl
pausebackchannel(1)
```

### variant: 基本写法
### variant_en: Basic
signature: void pausebackchannel(int chan_no)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| chan_no | int | * | 1~6 |  | 1,2,3 | 后台通道号 | bg channel |

---

## resetbackchannel
desc: 复位指定的后台通道

desc_en: Reset specified background channel

type: function

syntax: call

signature: void resetbackchannel(int chan_no)

returns: void

manual_ref: ARL V4.5.0：§5.12.17（manual p.217）

examples:

```arl
resetbackchannel(1)
```

### variant: 基本写法
### variant_en: Basic
signature: void resetbackchannel(int chan_no)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| chan_no | int | * | 1~6 |  | 1,2,3 | 后台通道号 | bg channel |

---

## curmpfile
desc: 获取运动指针当前所在ARL文件名

desc_en: Get motion pointer current file

type: function

syntax: call

signature: string curmpfile(int channel_index)

returns: string

manual_ref: ARL V4.5.0：§5.12.8（manual p.211）

examples:

```arl
string s = curmpfile(1)
```

### variant: 基本写法
### variant_en: Basic
signature: string curmpfile(int channel_index)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| channel_index | int | * | 1~6 |  | 1,2,3 | 通道索引 | channel idx |

---

## curmpline
desc: 获取运动指针当前所在行号

desc_en: Get motion pointer current line

type: function

syntax: call

signature: int curmpline(int channel_index)

returns: int

manual_ref: ARL V4.5.0：§5.12.9（manual p.212）

examples:

```arl
int i = curmpline(1)
```

### variant: 基本写法
### variant_en: Basic
signature: int curmpline(int channel_index)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| channel_index | int | * | 1~6 |  | 1,2,3 | 通道索引 | channel idx |

---

## curppfile
desc: 获取程序指针当前所在ARL文件名

desc_en: Get program pointer current file

type: function

syntax: call

signature: string curppfile(int channel_index)

returns: string

manual_ref: ARL V4.5.0：§5.12.10（manual p.213）

examples:

```arl
string s = curppfile(1)
```

### variant: 基本写法
### variant_en: Basic
signature: string curppfile(int channel_index)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| channel_index | int | * | 1~6 |  | 1,2,3 | 通道索引 | channel idx |

---

## curppline
desc: 获取程序指针当前所在行号

desc_en: Get program pointer current line

type: function

syntax: call

signature: int curppline(int channel_index)

returns: int

manual_ref: ARL V4.5.0：§5.12.11（manual p.213）

examples:

```arl
int i = curppline(1)
```

### variant: 基本写法
### variant_en: Basic
signature: int curppline(int channel_index)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| channel_index | int | * | 1~6 |  | 1,2,3 | 通道索引 | channel idx |

---

## abs
desc: 绝对值

desc_en: Absolute value

type: function

syntax: call

signature: double abs(double x) 或 int abs(int x)

returns: double 或 int（取决于参数类型）

manual_ref: ARL V4.5.0：§5.1.1（manual p.107）

examples:

```arl
double x = -11.11
int y = -10
double resultx = abs(x)
```

### variant: 浮点绝对值
### variant_en: Double
signature: double abs(double x)
returns: double
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| x | double | * |  |  |  | 输入浮点数 | double input |

### variant: 整型绝对值
### variant_en: Integer
signature: int abs(int x)
returns: int
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| x | int | * |  |  |  | 输入整数 | integer input |

wizard:

| 预设 | preset_en | 变体 | 选用参数 |
|---|---|---|---|
| 浮点绝对值 | Double | 浮点绝对值 |  |
| 整型绝对值 | Integer | 整型绝对值 |  |

---

## sqrt
desc: 平方根

desc_en: Square root

type: function

syntax: call

signature: double sqrt(double x)

returns: double

manual_ref: ARL V4.5.0：§5.1.17（manual p.116）

examples:

```arl
double x = 2
double y = sqrt(x)
```

### variant: 基本写法
### variant_en: Basic
signature: double sqrt(double x)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| x | double | * | >=0 |  |  | 输入值 | input |

---

## sin
desc: 正弦（弧度）

desc_en: Sine (radians)

type: function

syntax: call

signature: double sin(double x)

returns: double

manual_ref: ARL V4.5.0：§5.1.2（manual p.107）

examples:

```arl
double x = PI/6
double y = sin(x)
```

### variant: 基本写法
### variant_en: Basic
signature: double sin(double x)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| x | double | * |  |  |  | 角度rad | angle (rad) |

---

## cos
desc: 余弦（弧度）

desc_en: Cosine (radians)

type: function

syntax: call

signature: double cos(double x)

returns: double

manual_ref: ARL V4.5.0：§5.1.3（manual p.108）

examples:

```arl
double x = PI/3
double y = cos(x)
```

### variant: 基本写法
### variant_en: Basic
signature: double cos(double x)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| x | double | * |  |  |  | 角度rad | angle (rad) |

---

## tan
desc: 正切（弧度）

desc_en: Tangent (radians)

type: function

syntax: call

signature: double tan(double x)

returns: double

manual_ref: ARL V4.5.0：§5.1.4（manual p.108）

examples:

```arl
double x = PI/4
double y = tan(x)
```

### variant: 基本写法
### variant_en: Basic
signature: double tan(double x)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| x | double | * |  |  |  | 角度rad | angle (rad) |

---

## asin
desc: 反正弦，返回弧度

desc_en: Arc sine (radians)

type: function

syntax: call

signature: double asin(double x)

returns: double

manual_ref: ARL V4.5.0：§5.1.5（manual p.109）

examples:

```arl
double x = 0.5
double y = asin(x)
```

### variant: 基本写法
### variant_en: Basic
signature: double asin(double x)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| x | double | * | -1~1 |  |  | 输入值 | input |

---

## acos
desc: 反余弦，返回弧度

desc_en: Arc cosine (radians)

type: function

syntax: call

signature: double acos(double x)

returns: double

manual_ref: ARL V4.5.0：§5.1.6（manual p.110）

examples:

```arl
double x = 0.5
double y = acos(x)
```

### variant: 基本写法
### variant_en: Basic
signature: double acos(double x)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| x | double | * | -1~1 |  |  | 输入值 | input |

---

## atan
desc: 反正切，返回弧度

desc_en: Arc tangent (radians)

type: function

syntax: call

signature: double atan(double x)

returns: double

manual_ref: ARL V4.5.0：§5.1.7（manual p.110）

examples:

```arl
double x = 1
double y = atan(x)
```

### variant: 基本写法
### variant_en: Basic
signature: double atan(double x)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| x | double | * |  |  |  | 输入值 | input |

---

## atan2
desc: 四象限反正切

desc_en: Four-quadrant arc tangent

type: function

syntax: call

signature: double atan2(double y, double x)

returns: double

manual_ref: ARL V4.5.0：§5.1.8（manual p.111）

examples:

```arl
double x = 1
double y = 1
double z = atan2(y,x)
```

### variant: 基本写法
### variant_en: Basic
signature: double atan2(double y, double x)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| y | double | * |  |  |  | y分量 | y |
| x | double | * |  |  |  | x分量 | x |

---

## sinh
desc: 双曲正弦

desc_en: Hyperbolic sine

type: function

syntax: call

signature: double sinh(double x)

returns: double

manual_ref: ARL V4.5.0：§5.1.9（manual p.111）

examples:

```arl
double x = 1
double y = sinh(x)
```

### variant: 基本写法
### variant_en: Basic
signature: double sinh(double x)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| x | double | * |  |  |  | 输入值 | input |

---

## cosh
desc: 双曲余弦

desc_en: Hyperbolic cosine

type: function

syntax: call

signature: double cosh(double x)

returns: double

manual_ref: ARL V4.5.0：§5.1.10（manual p.112）

examples:

```arl
double x = 1
double y = cosh(x)
```

### variant: 基本写法
### variant_en: Basic
signature: double cosh(double x)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| x | double | * |  |  |  | 输入值 | input |

---

## tanh
desc: 双曲正切

desc_en: Hyperbolic tangent

type: function

syntax: call

signature: double tanh(double x)

returns: double

manual_ref: ARL V4.5.0：§5.1.11（manual p.113）

examples:

```arl
double x = 1
double y = tanh(x)
```

### variant: 基本写法
### variant_en: Basic
signature: double tanh(double x)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| x | double | * |  |  |  | 输入值 | input |

---

## exp
desc: e的x次方

desc_en: e to the power x

type: function

syntax: call

signature: double exp(double x)

returns: double

manual_ref: ARL V4.5.0：§5.1.12（manual p.113）

examples:

```arl
double x = 1
double y = exp(x)
```

### variant: 基本写法
### variant_en: Basic
signature: double exp(double x)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| x | double | * |  |  |  | 指数值 | exponent |

---

## pow
desc: 幂运算

desc_en: Power operation

type: function

syntax: call

signature: double pow(double x, double y)

returns: double

manual_ref: ARL V4.5.0：§5.1.13（manual p.114）

examples:

```arl
double x = 2
double y = 3
double z = pow(x,y)
```

### variant: 基本写法
### variant_en: Basic
signature: double pow(double x, double y)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| x | double | * |  |  |  | 底数 | base |
| y | double | * |  |  |  | 指数 | exp |

---

## pow10
desc: 10的n次方

desc_en: 10 to the power n

type: function

syntax: call

signature: double pow10(double x)

returns: double

manual_ref: ARL V4.5.0：§5.1.14（manual p.114）

examples:

```arl
double x = -1
double y = pow10(x)
```

### variant: 基本写法
### variant_en: Basic
signature: double pow10(double x)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| x | double | * |  |  |  | 指数 | exp |

---

## log
desc: 自然对数 ln(x)

desc_en: Natural logarithm ln(x)

type: function

syntax: call

signature: double log(double x)

returns: double

manual_ref: ARL V4.5.0：§5.1.15（manual p.115）

examples:

```arl
double x = 2
double y = log(x)
```

### variant: 基本写法
### variant_en: Basic
signature: double log(double x)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| x | double | * | >0 |  |  | 输入值 | input |

---

## log10
desc: 以10为底对数

desc_en: Base-10 logarithm

type: function

syntax: call

signature: double log10(double x)

returns: double

manual_ref: ARL V4.5.0：§5.1.16（manual p.116）

examples:

```arl
double x = 100
double y = log10(x)
```

### variant: 基本写法
### variant_en: Basic
signature: double log10(double x)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| x | double | * | >0 |  |  | 输入值 | input |

---

## floor
desc: 向下取整

desc_en: Floor

type: function

syntax: call

signature: double floor(double x)

returns: double

manual_ref: ARL V4.5.0：§5.1.18（manual p.117）

examples:

```arl
double x = 2.36
double y = floor(x)
```

### variant: 基本写法
### variant_en: Basic
signature: double floor(double x)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| x | double | * |  |  |  | 输入值 | input |

---

## ceil
desc: 向上取整

desc_en: Ceiling

type: function

syntax: call

signature: double ceil(double x)

returns: double

manual_ref: ARL V4.5.0：§5.1.19（manual p.117）

examples:

```arl
double x = 2.36
double y = ceil(x)
```

### variant: 基本写法
### variant_en: Basic
signature: double ceil(double x)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| x | double | * |  |  |  | 输入值 | input |

---

## fmod
desc: 浮点取余

desc_en: Float modulo

type: function

syntax: call

signature: double fmod(double x, double y)

returns: double

manual_ref: ARL V4.5.0：§5.1.22（manual p.119）

examples:

```arl
double x = 12.58
double y = 2.6
double z = fmod(x,y)
```

### variant: 基本写法
### variant_en: Basic
signature: double fmod(double x, double y)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| x | double | * |  |  |  | 被除数 | dividend |
| y | double | * | !=0 |  |  | 除数 | divisor |

---

## modf
desc: 分离整数与小数部分

desc_en: Split integer and fractional parts

type: function

syntax: call

signature: double modf(double x, int &y)

returns: double

manual_ref: ARL V4.5.0：§5.1.23（manual p.120）

verification: confirmed-user-correction

examples:

```arl
double x = 123.456
int y
double z = modf(x,y)
```

### variant: 基本写法
### variant_en: Basic
signature: double modf(double x, int &y)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| x | double | * |  |  |  | 被分解的浮点数 | Decomposed floating-point numbers |
| y | int | * |  |  |  | 返回的浮点数的整数部分（输出，需可写变量） | The integer part of the returned floating-point number |

notes:

- 手册示例把 y 声明为 `double`，与原型 `int &y` 不符；用户确认示例有误，y 应为 int。

---

## hypot
desc: 计算直角三角形斜边长 √(x²+y²)

desc_en: Hypotenuse √(x²+y²)

type: function

syntax: call

signature: double hypot(double x, double y)

returns: double

manual_ref: ARL V4.5.0：§5.1.24（manual p.121）

examples:

```arl
double x = 6
double y = 8
double z = hypot(x,y)
```

### variant: 基本写法
### variant_en: Basic
signature: double hypot(double x, double y)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| x | double | * |  |  |  | x边长 | x |
| y | double | * |  |  |  | y边长 | y |

---

## rand
desc: 产生随机数

desc_en: Generate random number

type: function

syntax: call

signature: int rand() 或 double rand(double start, double end) 或 double rand(int start, int end)

returns: int 或 double（取决于写法）

manual_ref: ARL V4.5.0：§5.1.25（manual p.121）；§5.1.26（manual p.122）

examples:

```arl
int x = rand()
```

### variant: 无参数整数
### variant_en: No arguments
signature: int rand()
returns: int
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|

### variant: 浮点范围
### variant_en: Double range
signature: double rand(double start, double end)
returns: double
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| start | double | * |  |  |  | 最小值 | min |
| end | double | * |  |  |  | 最大值 | max |

### variant: 整数范围
### variant_en: Integer range
signature: double rand(int start, int end)
returns: double
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| start | int | * |  |  |  | 最小值 | min |
| end | int | * |  |  |  | 最大值 | max |

wizard:

| 预设 | preset_en | 变体 | 选用参数 |
|---|---|---|---|
| 浮点范围 | Double range | 浮点范围 |  |
| 无参数整数 | No arguments | 无参数整数 |  |
| 整数范围 | Integer range | 整数范围 |  |

---

## norm
desc: 求向量距离原点的长度（模）

desc_en: Vector magnitude (norm)

type: function

syntax: call

signature: double norm(pos p)

returns: double

manual_ref: ARL V4.5.0：§5.1.27（manual p.123）

examples:

```arl
pos p = {x 300,y 400,z 500}
double len = norm(p)
```

### variant: 基本写法
### variant_en: Basic
signature: double norm(pos p)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| p | pos | * |  |  | pos1 | 向量 | vector |

---

## trunc
desc: 截断浮点数至指定小数位

desc_en: Truncate float to N decimals

type: function

syntax: call

signature: double trunc(double num, int n, bool round)

returns: double

manual_ref: ARL V4.5.0：§5.1.28（manual p.123）

examples:

```arl
double num = 3.1415926
int n = 4
double result1 = trunc(num,n,true)
```

### variant: 基本写法
### variant_en: Basic
signature: double trunc(double num, int n, bool round)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| num | double | * |  |  |  | 输入值 | input |
| n | int | * | >=0 |  | 1,2,3,4 | 保留小数位数 | decimals |
| round | bool | * | 0,1 |  | 0,1 | 是否四舍五入 | round |

---

## frexp
desc: 分解浮点数为尾数和指数

desc_en: Split float into mantissa and exponent

type: function

syntax: call

signature: double frexp(double val, int &exp)

returns: double

manual_ref: ARL V4.5.0：§5.1.20（manual p.118）

examples:

```arl
double val = 64
int exp
double y = frexp(val,exp)
```

### variant: 基本写法
### variant_en: Basic
signature: double frexp(double val, int &exp)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| val | double | * |  |  |  | 输入浮点数 | float |
| exp | int | * |  |  |  | 指数输出变量（输出，需可写变量） | exp out |

---

## ldexp
desc: 装载浮点数 val × 2^exp

desc_en: Load float: val × 2^exp

type: function

syntax: call

signature: double ldexp(double val, int exp)

returns: double

manual_ref: ARL V4.5.0：§5.1.21（manual p.119）

examples:

```arl
double val = 3
int exp = 3
double y = ldexp(val,exp)
```

### variant: 基本写法
### variant_en: Basic
signature: double ldexp(double val, int exp)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| val | double | * |  |  |  | 尾数 | mantissa |
| exp | int | * |  |  |  | 指数 | exp |

---

## cjoint
desc: 获取机器人当前各轴位置（含外轴；后台通道不能使用）

desc_en: Get current joint positions

type: function

syntax: call

signature: joint cjoint()

returns: joint

manual_ref: ARL V4.5.0：§5.8.1（manual p.174）


examples:

```arl
joint a = {j1 0,j2 10,j3 20,j4 30,j5 40,j6 50}
movej a
waittime 0
print cjoint()
```

---

## cpose
desc: 获取机器人当前TCP位姿

desc_en: Get current TCP pose

type: function

syntax: call

signature: pose cpose(tool t, wobj w)

returns: pose

manual_ref: ARL V4.5.0：§5.8.2（manual p.175）

examples:

```arl
pose p = { x 763.869,y 207.323,z 1422.841,a 129.538,b 0.480,c 92.084,cfg 0}
ptp p
waittime 0
wobj wobj1 = {{10,0,0,0,0,0}}
print cpose($FLANGE,wobj1)
```

### variant: 基本写法
### variant_en: Basic
signature: pose cpose(tool t, wobj w)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| t | tool | * |  |  | $FLANGE,$tool0,$tool1,$tool2 | 工具坐标系 | tool frame |
| w | wobj | * |  |  | $WORLD,$wobj0,$wobj1,$wobj2 | 工件坐标系 | work obj |

---

## getpose
desc: 运动学正解：由轴位置求TCP位姿

desc_en: Forward kinematics: joint → TCP pose

type: function

syntax: call

signature: pose getpose(joint j, tool t, wobj w)

returns: pose

manual_ref: ARL V4.5.0：§5.8.3（manual p.175）

examples:

```arl
joint j = {j1 0,j2 10,j3 20,j4 30,j5 40,j6 50}
wobj wobj1 = {{10,0,0,0,0,0}}
print getpose(j,$FLANGE,wobj1)
```

### variant: 基本写法
### variant_en: Basic
signature: pose getpose(joint j, tool t, wobj w)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| j | joint | * |  |  | j1 | 轴位置 | joint pos |
| t | tool | * |  |  | $FLANGE,$tool0,$tool1,$tool2 | 工具坐标系 | tool frame |
| w | wobj | * |  |  | $WORLD,$wobj0,$wobj1,$wobj2 | 工件坐标系 | work obj |

---

## getjoint
desc: 运动学逆解：由TCP位姿求轴位置

desc_en: Inverse kinematics: pose → joint

type: function

syntax: call

signature: joint getjoint(pose p, tool t, wobj w)

returns: joint

manual_ref: ARL V4.5.0：§5.8.4（manual p.176）

examples:

```arl
pose p = {x 763.869,y 207.323,z 1422.841,a 129.538,b 0.480,c 92.084,cfg 0}
print getjoint(p,$FLANGE,$WORLD)
```

### variant: 基本写法
### variant_en: Basic
signature: joint getjoint(pose p, tool t, wobj w)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| p | pose | * |  |  |  | 目标位姿 | target pose |
| t | tool | * |  |  | $FLANGE,$tool0,$tool1,$tool2 | 工具坐标系 | tool frame |
| w | wobj | * |  |  | $WORLD,$wobj0,$wobj1,$wobj2 | 工件坐标系 | work obj |

---

## poseinv
desc: 求位姿逆变换

desc_en: Pose inverse transform

type: function

syntax: call

signature: pose poseinv(pose p)

returns: pose

manual_ref: ARL V4.5.0：§5.8.5（manual p.177）

examples:

```arl
pose p = {x 1,y 2,z 3,a 0,b 0,c 0}
print poseinv(p)
```

### variant: 基本写法
### variant_en: Basic
signature: pose poseinv(pose p)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| p | pose | * |  |  | p1,[null] | 原始位姿 | pose |

---

## offset
desc: 目标点相对工件坐标系平移、旋转（ZYX 欧拉角顺序）

desc_en: Offset a target in the work-object frame

type: function

syntax: call

signature: pose offset(pose p, double dx, double dy, double dz) / pose offset(pose p, double dx, double dy, double dz, double rz, double ry, double rx)

returns: pose

manual_ref: ARL V4.5.0：§5.8.6（manual p.177）；四参数写法由用户确认

verification: confirmed-user-correction

examples:

```arl
p=offset (p,dx,dy,dz,rz,ry,rx)
```

### variant: 位置
### variant_en: Position
signature: pose offset(pose pose, double dx, double dy, double dz)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| pose | pose | * |  |  | p1 | 原始位姿 | pose |
| dx | double | * |  | mm | 0 | X方向偏移 | dx |
| dy | double | * |  | mm | 0 | Y方向偏移 | dy |
| dz | double | * |  | mm | 0 | Z方向偏移 | dz |

### variant: 位置+姿态
### variant_en: Position + orientation
signature: pose offset(pose pose, double dx, double dy, double dz, double rz, double ry, double rx)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| pose | pose | * |  |  | p1 | 原始位姿 | pose |
| dx | double | * |  | mm | 0 | X方向偏移 | dx |
| dy | double | * |  | mm | 0 | Y方向偏移 | dy |
| dz | double | * |  | mm | 0 | Z方向偏移 | dz |
| rz | double | * |  | ° | 0 | 绕Z旋转 | rz |
| ry | double | * |  | ° | 0 | 绕Y旋转 | ry |
| rx | double | * |  | ° | 0 | 绕X旋转 | rx |

wizard:

| 预设 | preset_en | 变体 | 选用参数 |
|---|---|---|---|
| 位置 | Position | 位置 |  |
| 位置+姿态 | Position + orientation | 位置+姿态 |  |

---

## reltool
desc: 目标点相对工具坐标系平移、旋转（ZYX 欧拉角顺序）

desc_en: Pose offset in tool frame

type: function

syntax: call

signature: pose reltool(pose p, double dx, double dy, double dz) / pose reltool(pose p, double dx, double dy, double dz, double rz, double ry, double rx)

returns: pose

manual_ref: ARL V4.5.0：§5.8.7（manual p.178）；四参数写法由用户确认

verification: confirmed-user-correction

examples:

```arl
pose p2 = reltool(p1, dx, dy, dz, rz, ry, rx)
```

### variant: 位置
### variant_en: Position
signature: pose reltool(pose pose, double dx, double dy, double dz)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| pose | pose | * |  |  | p1 | 原始位姿 | pose |
| dx | double | * |  | mm | 0 | 工具X偏移 | tool dx |
| dy | double | * |  | mm | 0 | 工具Y偏移 | tool dy |
| dz | double | * |  | mm | 0 | 工具Z偏移 | tool dz |

### variant: 位置+姿态
### variant_en: Position + orientation
signature: pose reltool(pose pose, double dx, double dy, double dz, double rz, double ry, double rx)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| pose | pose | * |  |  | p1 | 原始位姿 | pose |
| dx | double | * |  | mm | 0 | 工具X偏移 | tool dx |
| dy | double | * |  | mm | 0 | 工具Y偏移 | tool dy |
| dz | double | * |  | mm | 0 | 工具Z偏移 | tool dz |
| rz | double | * |  | ° | 0 | 绕工具Z旋转 | tool rz |
| ry | double | * |  | ° | 0 | 绕工具Y旋转 | tool ry |
| rx | double | * |  | ° | 0 | 绕工具X旋转 | tool rx |

wizard:

| 预设 | preset_en | 变体 | 选用参数 |
|---|---|---|---|
| 位置 | Position | 位置 |  |
| 位置+姿态 | Position + orientation | 位置+姿态 |  |

---

## cjttq
desc: 获取各轴输出力矩

desc_en: Get joint output torques

type: function

syntax: call

signature: jttq cjttq(int chan_no, bool Is_cmd)

returns: jttq

manual_ref: ARL V4.5.0：§5.8.8（manual p.180）

examples:

```arl
pose p = {x 763.869,y 207.323,z 1422.841,a 129.538,b 0.480,c 92.084,cfg 0}
ptp p
print cjttq(1,true)
```

### variant: 基本写法
### variant_en: Basic
signature: jttq cjttq(int chan_no, bool Is_cmd)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| chan_no | int | * | 1~6 |  | 1,2,3 | 通道号 | channel |
| Is_cmd | bool | * | 0,1 |  | 0,1 | 是否指令值 | is cmd |

---

## cjtci
desc: 获取各轴电机电流

desc_en: Get joint motor currents

type: function

syntax: call

signature: jtci cjtci(int chan_no, bool Is_cmd)

returns: jtci

manual_ref: ARL V4.5.0：§5.8.9（manual p.181）

examples:

```arl
pose p = {x 763.869,y 207.323,z 1422.841,a 129.538,b 0.480,c 92.084,cfg 0}
ptp p
print cjtci(1,true)
```

### variant: 基本写法
### variant_en: Basic
signature: jtci cjtci(int chan_no, bool Is_cmd)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| chan_no | int | * | 1~6 |  | 1,2,3 | 通道号 | channel |
| Is_cmd | bool | * | 0,1 |  | 0,1 | 是否指令值 | is cmd |

---

## channeltojoint
desc: 获取运行目标点的轴位置

desc_en: Get target point joint position

type: function

syntax: call

signature: joint channeltojoint(int chan_no)

returns: joint

manual_ref: ARL V4.5.0：§5.8.10（manual p.182）

examples:

```arl
joint a = {j1 0,j2 10,j3 20,j4 30,j5 40,j6 50}
movej a
print channeltojoint(1)
```

### variant: 基本写法
### variant_en: Basic
signature: joint channeltojoint(int chan_no)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| chan_no | int | * | 1~6 |  | 1,2,3 | 通道号 | channel |

---

## channeltopose
desc: 获取运行目标点的TCP位姿

desc_en: Get target point TCP pose

type: function

syntax: call

signature: pose channeltopose(int chan_no, tool t, wobj w)

returns: pose

manual_ref: ARL V4.5.0：§5.8.11（manual p.183）

examples:

```arl
pose p = {x 753.869,y 207.323,z 1422.841,a 129.538,b 0.480,c 92.084,cfg 0}
ptp p
wobj wobj1 = {{10,0,0,0,0,0}}
print channeltopose(1,$FLANGE,wobj1)
```

### variant: 基本写法
### variant_en: Basic
signature: pose channeltopose(int chan_no, tool t, wobj w)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| chan_no | int | * | 1~6 |  | 1,2,3 | 通道号 | channel |
| t | tool | * |  |  | $FLANGE,$tool0,$tool1,$tool2 | 工具坐标系 | tool frame |
| w | wobj | * |  |  | $WORLD,$wobj0,$wobj1,$wobj2 | 工件坐标系 | work obj |

---

## channeljoint
desc: 获取通道当前轴位置

desc_en: Get channel current joint position

type: function

syntax: call

signature: joint channeljoint(int chan_no, bool Is_cmd)

returns: joint

manual_ref: ARL V4.5.0：§5.8.12（manual p.184）

examples:

```arl
joint a = {j1 0,j2 10,j3 20,j4 30,j5 40,j6 50}
movej a
waittime 0
print channeljoint(1,true)
```

### variant: 基本写法
### variant_en: Basic
signature: joint channeljoint(int chan_no, bool Is_cmd)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| chan_no | int | * | 1~6 |  | 1,2,3 | 通道号 | channel |
| Is_cmd | bool | * | 0,1 |  | 0,1 | 是否指令值 | is cmd |

---

## channelpose
desc: 获取通道当前TCP位姿

desc_en: Get channel current TCP pose

type: function

syntax: call

signature: pose channelpose(int chan_no, tool t, wobj w, bool Is_cmd)

returns: pose

manual_ref: ARL V4.5.0：§5.8.13（manual p.185）

examples:

```arl
pose p = {x 753.869,y 207.323,z 1422.841,a 129.538,b 0.480,c 92.084,cfg 0}
ptp p
waittime 0
wobj wobj1 = {{10,0,0,0,0,0}}
print channelpose(1,$FLANGE,wobj1,true)
```

### variant: 基本写法
### variant_en: Basic
signature: pose channelpose(int chan_no, tool t, wobj w, bool Is_cmd)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| chan_no | int | * | 1~6 |  | 1,2,3 | 前台通道号 | channel |
| t | tool | * |  |  | $FLANGE,$tool0,$tool1,$tool2 | 工具坐标系 | tool frame |
| w | wobj | * |  |  | $WORLD,$wobj0,$wobj1,$wobj2 | 工件坐标系 | work obj |
| Is_cmd | bool | * | 0,1 |  | 0,1 | 是否指令值 | is cmd |

---

## channeljointvel
desc: 获取各轴当前速度

desc_en: Get joint current velocities

type: function

syntax: call

signature: jvel channeljointvel(int chan_no, bool Is_cmd)

returns: jvel

manual_ref: ARL V4.5.0：§5.8.14（manual p.185）

examples:

```arl
joint a = {j1 0,j2 10,j3 20,j4 30,j5 40,j6 50}
movej a
print channeljointvel(1, true)
```

### variant: 基本写法
### variant_en: Basic
signature: jvel channeljointvel(int chan_no, bool Is_cmd)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| chan_no | int | * | 1~6 |  | 1,2,3 | 前台通道号 | channel |
| Is_cmd | bool | * | 0,1 |  | 0,1 | 是否指令值 | is cmd |

---

## channeltcpvel
desc: 获取当前TCP点速度

desc_en: Get current TCP speed

type: function

syntax: call

signature: double channeltcpvel(int chan_no, tool t, wobj w, bool Is_cmd)

returns: double

manual_ref: ARL V4.5.0：§5.8.15（manual p.186）

examples:

```arl
wobj wobj1 = {{10,0,0,0,0,0}}
print channeltcpvel(1,$FLANGE,wobj1,true)
```

### variant: 基本写法
### variant_en: Basic
signature: double channeltcpvel(int chan_no, tool t, wobj w, bool Is_cmd)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| chan_no | int | * | 1~6 |  | 1,2,3 | 前台通道号 | channel |
| t | tool | * |  |  | $FLANGE,$tool0,$tool1,$tool2 | 工具坐标系 | tool frame |
| w | wobj | * |  |  | $WORLD,$wobj0,$wobj1,$wobj2 | 工件坐标系 | work obj |
| Is_cmd | bool | * | 0,1 |  | 0,1 | 是否指令值 | is cmd |

---

## ctcpforce
desc: 获取TCP点六维力矢量（仅前台通道可用）

desc_en: Get TCP 6D force vector

type: function

syntax: call

signature: tcpforce ctcpforce(int chan_no, tool t, wobj w)

returns: tcpforce

manual_ref: ARL V4.5.0：§5.8.16（manual p.187）

examples:

```arl
pose p = {x 763.869,y 207.323,z 1422.841,a 129.538,b 0.480,c 92.084,cfg 0}
ptp p
wobj wobj1 = {{10,0,0,0,0,0}}
print ctcpforce(1,$FLANGE,wobj1)
```

### variant: 基本写法
### variant_en: Basic
signature: tcpforce ctcpforce(int chan_no, tool t, wobj w)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| chan_no | int | * | 1~6 |  | 1,2,3 | 前台通道号 | channel |
| t | tool | * |  |  | $FLANGE,$tool0,$tool1,$tool2 | 工具坐标系 | tool frame |
| w | wobj | * |  |  | $WORLD,$wobj0,$wobj1,$wobj2 | 工件坐标系 | work obj |

---

## getposetool
desc: 根据ID获取工具位姿变量

desc_en: Get tool pose variable by ID

type: function

syntax: call

signature: pose getposetool(uint pose_index)

returns: pose

manual_ref: ARL V4.5.0：§5.8.17（manual p.189）；§5.8.18（manual p.189）

examples:

```arl
print getposetool(4)
```

### variant: 按序号
### variant_en: By index
signature: pose getposetool(uint pose_index)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| pose_index | uint | * |  |  | 0,1,2 | 工具ID | tool idx |

### variant: 按名称
### variant_en: By name
signature: pose getposetool(string pose_name)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| pose_name | string | * |  |  | "tool1" | 工具名称 | tool name |

wizard:

| 预设 | preset_en | 变体 | 选用参数 |
|---|---|---|---|
| 按序号 | By index | 按序号 |  |
| 按名称 | By name | 按名称 |  |

---

## getposewobj
desc: 根据ID获取工件位姿变量

desc_en: Get wobj pose variable by ID

type: function

syntax: call

signature: pose getposewobj(uint pose_index)

returns: pose

manual_ref: ARL V4.5.0：§5.8.19（manual p.190）；§5.8.20（manual p.190）

examples:

```arl
print getposewobj(4)
```

### variant: 按序号
### variant_en: By index
signature: pose getposewobj(uint pose_index)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| pose_index | uint | * |  |  | 0,1,2,3 | 工件ID | wobj idx |

### variant: 按名称
### variant_en: By name
signature: pose getposewobj(string pose_name)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| pose_name | string | * |  |  | "wobj1" | 工件名称 | wobj name |

wizard:

| 预设 | preset_en | 变体 | 选用参数 |
|---|---|---|---|
| 按序号 | By index | 按序号 |  |
| 按名称 | By name | 按名称 |  |

---

## setposetool
desc: 设置位姿变量的工具坐标系

desc_en: Set pose variable tool frame

type: function

syntax: call

signature: void setposetool(uint pose_index, uint tool_index)

returns: void

manual_ref: ARL V4.5.0：§5.8.21（manual p.191）；§5.8.22（manual p.192）

examples:

```arl
setposetool(4, 7)
```

### variant: 按序号
### variant_en: By index
signature: void setposetool(uint pose_index, uint tool_index)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| pose_index | uint | * |  |  | 0,1,2,3 | 位姿ID | pose idx |
| tool_index | uint | * | 0~32 |  | 0,1,2,3 | 0=法兰，1~32=工具0~31 | tool idx |

### variant: 按名称
### variant_en: By name
signature: void setposetool(string pose_name, uint tool_index)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| pose_name | string | * |  |  | "p1" | 位姿变量名称 | pose name |
| tool_index | uint | * | 0~32 |  | 0,1,2,3 | 0=法兰，1~32=工具0~31 | tool idx |

wizard:

| 预设 | preset_en | 变体 | 选用参数 |
|---|---|---|---|
| 按序号 | By index | 按序号 |  |
| 按名称 | By name | 按名称 |  |

---

## setposewobj
desc: 设置位姿变量的工件坐标系

desc_en: Set pose variable work object

type: function

syntax: call

signature: void setposewobj(uint pose_index, uint wobj_index)

returns: void

manual_ref: ARL V4.5.0：§5.8.23（manual p.192）；§5.8.24（manual p.193）

examples:

```arl
setposewobj(4, 0)
```

### variant: 按序号
### variant_en: By index
signature: void setposewobj(uint pose_index, uint wobj_index)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| pose_index | uint | * |  |  | 0,1,2,3 | 位姿ID | pose idx |
| wobj_index | uint | * | 0~35 |  | 0,1,2,3 | 0=世界，1~3=BASE0~2，4~35=工件0~31 | wobj idx |

### variant: 按名称
### variant_en: By name
signature: void setposewobj(string pose_name, uint wobj_index)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| pose_name | string | * |  |  | "p1" | 位姿变量名称 | pose name |
| wobj_index | uint | * | 0~35 |  | 0,1,2,3 | 0=世界，1~3=BASE0~2，4~35=工件0~31 | wobj idx |

wizard:

| 预设 | preset_en | 变体 | 选用参数 |
|---|---|---|---|
| 按序号 | By index | 按序号 |  |
| 按名称 | By name | 按名称 |  |

---

## getwobj_3p
desc: 3点法标定工件坐标系

desc_en: 3-point work object calibration

type: function

syntax: call

signature: wobj getwobj_3p(joint j1, joint j2, joint j3, tool t)

returns: wobj

manual_ref: ARL V4.5.0：§5.9.1（manual p.194）

examples:

```arl
print getwobj_3p(j1,j2,j3,$TOOL0)
```

### variant: 基本写法
### variant_en: Basic
signature: wobj getwobj_3p(joint j1, joint j2, joint j3, tool t)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| j1 | joint | * |  |  | j1 | 工件坐标系原点对应的示教点 | origin point |
| j2 | joint | * |  |  | j2 | X 轴正向一点对应的示教点 | point on +X |
| j3 | joint | * |  |  | j3 | XY 平面上 Y 为正的一点对应的示教点 | point with +Y |
| t | tool | * |  |  | $FLANGE,$tool0,$tool1,$tool2 | 标定时使用的工具 | tool used |

---

## getwobj_indi
desc: 间接法标定工件坐标系

desc_en: Indirect work object calibration

type: function

syntax: call

signature: wobj getwobj_indi(joint j1, joint j2, joint j3, pos p1, pos p2, pos p3, tool t)

returns: wobj

manual_ref: ARL V4.5.0：§5.9.2（manual p.194）

examples:

```arl
print getwobj_indi(j1,j2,j3,p1,p2,p3, $TOOL0)
```

### variant: 基本写法
### variant_en: Basic
signature: wobj getwobj_indi(joint j1, joint j2, joint j3, pos p1, pos p2, pos p3, tool t)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| j1 | joint | * |  |  | j1 | p1 点对应的示教点 | taught point 1 |
| j2 | joint | * |  |  | j2 | p2 点对应的示教点 | taught point 2 |
| j3 | joint | * |  |  | j3 | p3 点对应的示教点 | taught point 3 |
| p1 | pos | * |  |  | pos1 | p1 点在待标定工件坐标系中的坐标 | known coord 1 |
| p2 | pos | * |  |  | pos2 | p2 点在待标定工件坐标系中的坐标 | known coord 2 |
| p3 | pos | * |  |  | pos3 | p3 点在待标定工件坐标系中的坐标 | known coord 3 |
| t | tool | * |  |  | $FLANGE,$tool0,$tool1,$tool2 | 标定时使用的工具 | tool used |

notes:

- p1~p3 为 pos（只含 x/y/z，不是 pose），jN 对应 pN，依据手册原型和示例。同版 PDF 表 5-116（p.195）中 j2 的说明印作"p1 点对应的示教点"，p2、p3 的类型印作 joint，与原型、示例不一致，向导不采用。

---

## getwobj_flange
desc: 法兰参照法标定工件坐标系

desc_en: Flange reference wobj calibration

type: function

syntax: call

signature: wobj getwobj_flange(joint j1, joint j2, tool t, bool xydefault)

returns: wobj

manual_ref: ARL V4.5.0：§5.9.3（manual p.195）

examples:

```arl
wobj w = getwobj_flange(j1,j2,knowntool,true)
```

### variant: 基本写法
### variant_en: Basic
signature: wobj getwobj_flange(joint j1, joint j2, tool t, bool xydefault)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| j1 | joint | * |  |  | j1 | 标定原点时记录的轴位置 | origin point |
| j2 | joint | * |  |  | j2 | 标定方向时记录的轴位置 | direction point |
| t | tool | * |  |  | $FLANGE,$tool0,$tool1,$tool2 | 标定原点时法兰上的标准工具；只用 x/y/z | reference tool (xyz only) |
| xydefault | bool | * | 0,1 |  | 0,1 | true 只标定 z 轴方向，xy 由系统默认；false 标定 xyz 方向 | use default XY |

---

## gettooltcp_ref
desc: 标准工具参照法标定TCP

desc_en: Reference tool TCP calibration

type: function

syntax: call

signature: void gettooltcp_ref(joint j1, joint j2, tool ref, tool& t)

returns: void

manual_ref: ARL V4.5.0：§5.9.4（manual p.197）

examples:

```arl
gettooltcp_ref(j1,j2,ref,t)
```

### variant: 基本写法
### variant_en: Basic
signature: void gettooltcp_ref(joint j1, joint j2, tool ref, tool& t)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| j1 | joint | * |  |  | j1 | 安装参考工具时的示教点 | point with ref tool |
| j2 | joint | * |  |  | j2 | 安装待测工具时的示教点 | point with target tool |
| ref | tool | * |  |  | $tool0,$tool1,$tool2 | 参考工具；只需 x/y/z | ref tool |
| t | tool | * |  |  | t1 | 待标定工具；结果写入其 x/y/z | tool out |

---

## gettoolrot_world
desc: 世界系参照法测量工具旋转

desc_en: World frame tool rotation measurement

type: function

syntax: call

signature: void gettoolrot_world(joint j, tool& t)

returns: void

manual_ref: ARL V4.5.0：§5.9.5（manual p.197）

examples:

```arl
gettoolrot_world (j,t)
```

### variant: 基本写法
### variant_en: Basic
signature: void gettoolrot_world(joint j, tool& t)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| j | joint | * |  |  | j1 | 示教点：工具 +X 平行于世界 −Z、工具 +Y 平行于世界 +Y、工具 +Z 平行于世界 +X 时记录 | taught point: tool +X ∥ world −Z, +Y ∥ +Y, +Z ∥ +X |
| t | tool | * |  |  | t1 | 待标定工具；结果写入其 a/b/c | tool out |

notes:

- 标定姿态按手册 §5.9.5（p.197）的公式图：TOOL +X ∥ WORLD −Z，TOOL +Y ∥ WORLD +Y，TOOL +Z ∥ WORLD +X；方向不对，算出的 a/b/c 就不对。

---

## gettoolrot_3p
desc: 3点法测量工具旋转

desc_en: 3-point tool rotation measurement

type: function

syntax: call

signature: void gettoolrot_3p(joint j1, joint j2, joint j3, tool& t)

returns: void

manual_ref: ARL V4.5.0：§5.9.6（manual p.198）

examples:

```arl
gettoolrot_3p (j1,j2,j3,t)
```

### variant: 基本写法
### variant_en: Basic
signature: void gettoolrot_3p(joint j1, joint j2, joint j3, tool& t)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| j1 | joint | * |  |  | j1 | 工具 TCP 驶向参考点时的示教点 | point1 |
| j2 | joint | * |  |  | j2 | 工具 X 轴负向一点驶向参考点时的示教点 | point2 |
| j3 | joint | * |  |  | j3 | 工具 XY 平面上 Y 为负的一点驶向参考点时的示教点 | point3 |
| t | tool | * |  |  | t1 | 待标定工具；需先填好 t_frame 的 x/y/z，结果写入 t_frame 的 a/b/c | tool out |

---

## gettool_3p
desc: 3点法标定工具坐标系

desc_en: 3-point tool calibration

type: function

syntax: call

signature: tool gettool_3p(joint j1, joint j2, joint j3, wobj w)

returns: tool

manual_ref: ARL V4.5.0：§5.9.7（manual p.199）

examples:

```arl
tool t = gettool_3p(j1,j2,j3,w)
```

### variant: 基本写法
### variant_en: Basic
signature: tool gettool_3p(joint j1, joint j2, joint j3, wobj w)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| j1 | joint | * |  |  | j1 | 坐标系原点驶向参考点时的示教点 | point1 |
| j2 | joint | * |  |  | j2 | X 轴正向一点驶向参考点时的示教点 | point2 |
| j3 | joint | * |  |  | j3 | XY 平面上 Y 为正的一点驶向参考点时的示教点 | point3 |
| w | wobj | * |  |  | w1 | 已知世界坐标的参考点；只用 w_frame 的 x/y/z | known reference point |

---

## getbase_3p
desc: 3点法标定基础坐标系

desc_en: Base frame calibration

type: function

syntax: call

signature: void getbase_3p(joint j1, joint j2, joint j3, tool t, int index)

returns: void

manual_ref: ARL V4.5.0：§5.9.8（manual p.200）

examples:

```arl
getbase_3p(j1,j2,j3, $TOOL0,1)
```

### variant: 基本写法
### variant_en: Basic
signature: void getbase_3p(joint j1, joint j2, joint j3, tool t, int index)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| j1 | joint | * |  |  | j1 | 世界坐标系原点对应的示教点 | point1 |
| j2 | joint | * |  |  | j2 | 世界坐标系 X 轴正向一点对应的示教点 | point2 |
| j3 | joint | * |  |  | j3 | 世界坐标系 XY 平面上 Y 为正的一点对应的示教点 | point3 |
| t | tool | * |  |  | $FLANGE,$tool0,$tool1,$tool2 | 标定时使用的工具 | tool used |
| index | int | * | 1~n（n 为当前通道机械单元总数） |  | 1,2 | 机械单元序号 | mechanical unit No. |

---

## strlen
desc: 字符串长度

desc_en: String length

type: function

syntax: call

signature: int strlen(string s)

returns: int

manual_ref: ARL V4.5.0：§5.4.1（manual p.130）

examples:

```arl
string s = "hello world!"
int len = strlen(s)
```

### variant: 基本写法
### variant_en: Basic
signature: int strlen(string s)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| s | string | * |  |  |  | 输入字符串 | input str |

---

## substr
desc: 截取子字符串

desc_en: Extract substring

type: function

syntax: call

signature: string substr(string s, int startpos, [int len])

returns: string

manual_ref: ARL V4.5.0：§5.4.2（manual p.131）

examples:

```arl
string s1 = "hello world!"
int startpos = 0
int len = 5
string s2 = substr(s1,startpos,len)
```

### variant: 基本写法
### variant_en: Basic
signature: string substr(string s, int startpos, [int len])
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| s | string | * |  |  | str1,$S[1] | 源字符串 | src str |
| startpos | int | * | 0~字符串长度-1 |  | 0,1,2,3 | 起始位置（从 0 开始） | start (0-based) |
| len | int |  | >=0 |  | 1,2,3 | 截取长度；省略时截到末尾 | length; to end if omitted |

---

## toint
desc: 转换成整型

desc_en: Convert to integer

type: function

syntax: call

signature: int toint(double d)/int toint(byte[] data, int start)/int toint(string number_string, num_base number_base)

returns: int

manual_ref: ARL V4.5.0：§5.7.1（manual p.169）

examples:

```arl
double value =3.1415
int s = toint(value)
```

### variant: 浮点转整型
### variant_en: Float to int
signature: int toint(double d)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| d | double | * |  |  |  | 输入浮点数 | float |

### variant: 字节转整型
### variant_en: Bytes to int
signature: int toint(byte[] data, int start)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| data | byte[] | * |  |  |  | 输入字节数组 | byte array |
| start | int | * |  |  | 0,1,2,3 | 起始偏移地址 | start offset |

### variant: 字符串转整型
### variant_en: String to int
signature: int toint(string number_string, num_base number_base)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| number_string | string | * |  |  |  | 输入字符串 | input str |
| number_base | num_base | * | dec,hex |  | dec,hex | 进制 | number base |

wizard:

| 预设 | preset_en | 变体 | 选用参数 |
|---|---|---|---|
| 浮点转整型 | Float to int | 浮点转整型 |  |
| 字节转整型 | Bytes to int | 字节转整型 |  |
| 字符串转整型 | String to int | 字符串转整型 |  |

---

## todouble
desc: 字节数组转浮点

desc_en: Byte array to float

type: function

syntax: call

signature: double todouble(byte[] data, int start)

returns: double

manual_ref: ARL V4.5.0：§5.7.2（manual p.170）

### variant: 基本写法
### variant_en: Basic
signature: double todouble(byte[] data, int start)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| data | byte[] | * |  |  |  | 字节数组 | byte[] |
| start | int | * |  |  | 0,1,2,3 | 起始索引 | start idx |

---

## tobytes
desc: 将数据转换为字节数组

desc_en: Convert data to byte array

type: function

syntax: call

signature: void tobytes(string/int/double src, byte[] dest, int start)

returns: void

manual_ref: ARL V4.5.0：§5.7.3（manual p.171）

examples:

```arl
byte result[4]
tobytes(14030201h,result,0)
```

### variant: 基本写法
### variant_en: Basic
signature: void tobytes(string/int/double src, byte[] dest, int start)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| src | any | * | 仅 string、int、double |  |  | 源数据；int 转 4 字节，double 转 8 字节 | src |
| dest | byte[] | * |  |  |  | 目标字节数组 | dest[] |
| start | int | * |  |  | 0,1,2,3 | 起始索引 | start idx |

---

## tostr
desc: 转换成字符串

desc_en: Convert to string

type: function

syntax: call

signature: string tostr(anytype v) 或 string tostr(double v, int precision) 或 string tostr(int v, num_base number_base)

returns: string

manual_ref: ARL V4.5.0：§5.7.4（manual p.172）

examples:

```arl
double value =3.1415
string s = tostr(value)
```

### variant: 任意类型
### variant_en: Any type
signature: string tostr(any v)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| v | any | * |  |  |  | 输入值 | input |

### variant: 浮点指定精度
### variant_en: Float with precision
signature: string tostr(double v, int precision)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| v | double | * |  |  |  | 输入浮点数 | float |
| precision | int | * |  |  | 2,3,4,0 | 有效数字位数，默认6 | significant digits; default 6 |

### variant: 整型按进制
### variant_en: Integer with base
signature: string tostr(int v, num_base number_base)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| v | int | * |  |  |  | 输入整型 | integer |
| number_base | num_base | * | dec,hex |  | dec,hex | 进制 | number base |

wizard:

| 预设 | preset_en | 变体 | 选用参数 |
|---|---|---|---|
| 任意类型 | Any type | 任意类型 |  |
| 浮点指定精度 | Float with precision | 浮点指定精度 |  |
| 整型按进制 | Integer with base | 整型按进制 |  |

---

## ftobytes
desc: 浮点数转换成字节数组

desc_en: Float to byte array

type: function

syntax: call

signature: void ftobytes(double src, byte[] data, int start)

returns: void

manual_ref: ARL V4.5.0：§5.7.5（manual p.173）

examples:

```arl
byte result[4]
double b = 1.23
ftobytes(b,result,0)
```

### variant: 基本写法
### variant_en: Basic
signature: void ftobytes(double src, byte[] data, int start)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| src | double | * |  |  |  | 浮点数 | float value |
| data | byte[] | * |  |  |  | 目标字节数组 | dest[] |
| start | int | * |  |  | 0,1,2,3 | 起始索引 | start idx |

---

## tofloat
desc: 字节数组转换成浮点数

desc_en: Byte array to float

type: function

syntax: call

signature: double tofloat(byte[] data, int start)

returns: double

manual_ref: ARL V4.5.0：§5.7.6（manual p.173）

examples:

```arl
byte result[4]
double b = 1.23
ftobytes(b,result,0)
print tofloat(result, 0)
```

### variant: 基本写法
### variant_en: Basic
signature: double tofloat(byte[] data, int start)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| data | byte[] | * |  |  |  | 字节数组 | byte[] |
| start | int | * |  |  | 0,1,2,3 | 起始索引 | start idx |

---

## bitcheck
desc: 检查指定位是否为1

desc_en: Check if bit is 1

type: function

syntax: call

signature: bool bitcheck(int &data, int pos) / bool bitcheck(byte &data, int pos)

returns: bool

manual_ref: ARL V4.5.0：§5.2.3（manual p.125）

examples:

```arl
byte data1= 00001000b
bool result = bitcheck(data1,2)
```

### variant: 整型
### variant_en: Integer
signature: bool bitcheck(int &data, int pos)
returns: bool
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| data | int | * |  |  |  | 输入数据 | data |
| pos | int | * | 0~31 |  | 0,1,2,3 | 位位置 | bit position |

### variant: 字节型
### variant_en: Byte
signature: bool bitcheck(byte &data, int pos)
returns: bool
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| data | byte | * |  |  |  | 输入数据 | data |
| pos | int | * | 0~7 |  | 0,1,2,3 | 位位置 | bit position |

wizard:

| 预设 | preset_en | 变体 | 选用参数 |
|---|---|---|---|
| 整型 | Integer | 整型 |  |
| 字节型 | Byte | 字节型 |  |

---

## bitset
desc: 将整数的指定位置1

desc_en: Set bit to 1

type: function

syntax: call

signature: void bitset(int &data, int pos) / void bitset(byte &data, int pos)

returns: void

manual_ref: ARL V4.5.0：§5.2.2（manual p.125）

examples:

```arl
byte data1= 00001000b
bitset(data1,2)
```

### variant: 整型
### variant_en: Integer
signature: void bitset(int &data, int pos)
returns: void
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| data | int | * |  |  |  | 待修改的可写变量 | data |
| pos | int | * | 0~31 |  | 0,1,2,3 | 位位置 | bit position |

### variant: 字节型
### variant_en: Byte
signature: void bitset(byte &data, int pos)
returns: void
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| data | byte | * |  |  |  | 待修改的可写变量 | data |
| pos | int | * | 0~7 |  | 0,1,2,3 | 位位置 | bit position |

wizard:

| 预设 | preset_en | 变体 | 选用参数 |
|---|---|---|---|
| 整型 | Integer | 整型 |  |
| 字节型 | Byte | 字节型 |  |

---

## bitclear
desc: 将整数的指定位清0

desc_en: Clear bit to 0

type: function

syntax: call

signature: void bitclear(int &data, int pos) / void bitclear(byte &data, int pos)

returns: void

manual_ref: ARL V4.5.0：§5.2.1（manual p.124）

examples:

```arl
byte data1= 00001111b
bitclear(data1,2)
```

### variant: 整型
### variant_en: Integer
signature: void bitclear(int &data, int pos)
returns: void
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| data | int | * |  |  |  | 待修改的可写变量 | data |
| pos | int | * | 0~31 |  | 0,1,2,3 | 位位置 | bit position |

### variant: 字节型
### variant_en: Byte
signature: void bitclear(byte &data, int pos)
returns: void
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| data | byte | * |  |  |  | 待修改的可写变量 | data |
| pos | int | * | 0~7 |  | 0,1,2,3 | 位位置 | bit position |

wizard:

| 预设 | preset_en | 变体 | 选用参数 |
|---|---|---|---|
| 整型 | Integer | 整型 |  |
| 字节型 | Byte | 字节型 |  |

---

## bitlcs
desc: 整数循环左移n位

desc_en: Circular left shift n bits

type: function

syntax: call

signature: int bitlcs(int data [, int n]) / byte bitlcs(byte data [, int n])

returns: int 或 byte（取决于参数类型）

manual_ref: ARL V4.5.0：§5.2.4（manual p.126）

examples:

```arl
byte data= 11000000b
print bitlcs(data,2)
```

### variant: 整型
### variant_en: Integer
signature: int bitlcs(int data [, int n])
returns: int
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| data | int | * |  |  |  | 输入数据 | data |
| n | int |  | >=0 |  | 1,2 | 移位位数；可省略，默认1 | shift count; optional, default 1 |

### variant: 字节型
### variant_en: Byte
signature: byte bitlcs(byte data [, int n])
returns: byte
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| data | byte | * |  |  |  | 输入数据 | data |
| n | int |  | >=0 |  | 1,2 | 移位位数；可省略，默认1 | shift count; optional, default 1 |

wizard:

| 预设 | preset_en | 变体 | 选用参数 |
|---|---|---|---|
| 整型 | Integer | 整型 |  |
| 字节型 | Byte | 字节型 |  |

---

## bitrcs
desc: 整数循环右移n位

desc_en: Circular right shift n bits

type: function

syntax: call

signature: int bitrcs(int data [, int n]) / byte bitrcs(byte data [, int n])

returns: int 或 byte（取决于参数类型）

manual_ref: ARL V4.5.0：§5.2.5（manual p.127）

examples:

```arl
byte data= 00000011b
print bitrcs(data,2)
```

### variant: 整型
### variant_en: Integer
signature: int bitrcs(int data [, int n])
returns: int
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| data | int | * |  |  |  | 输入数据 | data |
| n | int |  | >=0 |  | 1,2 | 移位位数；可省略，默认1 | shift count; optional, default 1 |

### variant: 字节型
### variant_en: Byte
signature: byte bitrcs(byte data [, int n])
returns: byte
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| data | byte | * |  |  |  | 输入数据 | data |
| n | int |  | >=0 |  | 1,2 | 移位位数；可省略，默认1 | shift count; optional, default 1 |

wizard:

| 预设 | preset_en | 变体 | 选用参数 |
|---|---|---|---|
| 整型 | Integer | 整型 |  |
| 字节型 | Byte | 字节型 |  |

---

## savearl
desc: 复制ARL文件

desc_en: Copy ARL file

type: function

syntax: call

signature: bool savearl(string file_src, string file_dst, bool mode)

returns: bool

manual_ref: ARL V4.5.0：§5.11.1（manual p.203）

examples:

```arl
print savearl("Recipe1.arl","Recipe2.arl",true)
```

### variant: 基本写法
### variant_en: Basic
signature: bool savearl(string file_src, string file_dst, bool mode)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| file_src | string | * |  |  | "Recipe1.arl" | 当前文件夹下的源 arl 文件名 | source file |
| file_dst | string | * |  |  | "Recipe2.arl" | 复制后的 arl 文件名 | target file |
| mode | bool | * | 0,1 |  | true,false | 是否覆盖同名文件 | overwrite |

---

## savefilepose
desc: 保存位姿至数据文件（重新加载后生效）

desc_en: Save pose to data file (takes effect after reload)

type: function

syntax: call

signature: bool savefilepose(string file_name, string p_name, pose p)

returns: bool

manual_ref: ARL V4.5.0：§5.11.2（manual p.204）

examples:

```arl
pose a = {x 0,y 10,z 15,a 0,b 90,c 0,cfg 0,ej1 20}
savefilepose("Recipe1_data.arl", "p1", a)
```

### variant: 基本写法
### variant_en: Basic
signature: bool savefilepose(string file_name, string p_name, pose p)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| file_name | string | * |  |  | "Recipe1_data.arl" | 存入点位的 _data.arl 文件名 | data file |
| p_name | string | * |  |  | "p1" | 数据文件中的位姿变量名 | pose name in file |
| p | pose | * |  |  | p1 | 位姿变量 | pose var |

notes:

- 写入 _data.arl 文件，重新加载后才生效；要立即生效用 saveposenow（写入已加载的程序）。
- 手册原型为 `const string&`、`const pose&`，是只读输入，向导按值写，不标 `&`（`&` 在本文件表示会被函数修改的参数）。

---

## savefilejoint
desc: 保存轴位置至数据文件（重新加载后生效）

desc_en: Save joint to data file (takes effect after reload)

type: function

syntax: call

signature: bool savefilejoint(string file_name, string joint_name, joint j)

returns: bool

manual_ref: ARL V4.5.0：§5.11.3（manual p.204）

examples:

```arl
joint a = {j1 0,j2 10,j3 20,j4 30,j5 40,j6 50}
savefilejoint("Recipe1_data.arl", "j1", a)
```

### variant: 基本写法
### variant_en: Basic
signature: bool savefilejoint(string file_name, string joint_name, joint j)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| file_name | string | * |  |  | "Recipe1_data.arl" | 存入点位的 _data.arl 文件名 | data file |
| joint_name | string | * |  |  | "j1" | 数据文件中的轴位置变量名 | joint name in file |
| j | joint | * |  |  | j1 | 轴位置变量 | joint var |

notes:

- 写入 _data.arl 文件，重新加载后才生效；要立即生效用 savejointnow（写入已加载的程序）。
- 参数名按手册参数表写 joint_name（原型写作 pose_name）。手册原型为 `const string&`、`const joint&`，是只读输入，向导按值写，不标 `&`。

---

## filesize
desc: 查询文件大小（字节）

desc_en: Query file size (bytes)

type: function

syntax: call

signature: int filesize(string file_name)

returns: int

manual_ref: ARL V4.5.0：§5.12.12（manual p.214）

examples:

```arl
int i = filesize("prog1.arl")
```

### variant: 基本写法
### variant_en: Basic
signature: int filesize(string file_name)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| file_name | string | * |  |  | "prog1.arl" | 文件名（相对 script 目录） | file name |

---

## renamefile
desc: 文件重命名

desc_en: Rename file

type: function

syntax: call

signature: bool renamefile(string file_name, string new_file_name)

returns: bool

manual_ref: ARL V4.5.0：§5.12.13（manual p.214）

examples:

```arl
bool result = renamefile("prog1.arl","prog2.arl")
```

### variant: 基本写法
### variant_en: Basic
signature: bool renamefile(string file_name, string new_file_name)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| file_name | string | * |  |  | "prog1.arl" | 原文件名 | old name |
| new_file_name | string | * |  |  | "prog2.arl" | 新文件名 | new name |

---

## removefile
desc: 删除文件

desc_en: Delete file

type: function

syntax: call

signature: bool removefile(string file_name)

returns: bool

manual_ref: ARL V4.5.0：§5.12.14（manual p.215）

examples:

```arl
bool result = removefile("prog2.arl")
```

### variant: 基本写法
### variant_en: Basic
signature: bool removefile(string file_name)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| file_name | string | * |  |  | "prog2.arl" | 文件名（相对 script 目录） | file name |

---

## gettextstr
desc: 读取文本文件指定行内容

desc_en: Read specified line from text file

type: function

syntax: call

signature: string gettextstr(string file_path, int line_no, [bool external_file])

returns: string

manual_ref: ARL V4.5.0：§5.12.7（manual p.211）

examples:

```arl
gettextstr("test1.txt",5, false)
```

### variant: 基本写法
### variant_en: Basic
signature: string gettextstr(string file_path, int line_no, [bool external_file])
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| file_path | string | * |  |  | "test1.txt" | 文件名，相对 script 目录（外部存储时相对 USB 目录） | file path |
| line_no | int | * | >=1 |  | 1,2,3 | 行号（从 1 开始） | line (1-based) |
| external_file | bool |  | 缺省 false |  | false,true | true 读外部存储 /home/USB；false 读内部 /home/ae/script | external storage |

---

## saveposenow
desc: 把 pose 变量写入指定前台通道已加载程序的点位（立即生效）

desc_en: Write a pose into a program loaded in a foreground channel (immediate)

type: function

syntax: call

signature: bool saveposenow(uint channel, string file_name, string pose_name, pose p)

returns: bool

manual_ref: ARL V4.5.0：§5.11.4（manual p.205）

examples:

```arl
pose a = {x 0,y 10,z 15,a 0,b 90,c 0,cfg 0,ej1 20}
saveposenow(1,"prog1.arl","p1", a)
```

### variant: 基本写法
### variant_en: Basic
signature: bool saveposenow(uint channel, string file_name, string pose_name, pose p)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| channel | uint | * |  |  | 1,2,3 | 前台通道号 | foreground channel |
| file_name | string | * |  |  | "prog1.arl" | 该通道加载的 arl 程序名 | loaded program |
| pose_name | string | * |  |  | "p1" | 存入文件的pose变量名称 | pose name in file |
| p | pose | * |  |  | p1 | 待存入的pose变量 | pose to save |

---

## savejointnow
desc: 把 joint 变量写入指定前台通道已加载程序的点位（立即生效）

desc_en: Write a joint into a program loaded in a foreground channel (immediate)

type: function

syntax: call

signature: bool savejointnow(uint channel, string file_name, string pose_name, joint j)

returns: bool

manual_ref: ARL V4.5.0：§5.11.5（manual p.206）

examples:

```arl
joint a = {j1 0,j2 10,j3 20,j4 30,j5 40,j6 50}
savejointnow(1,"prog1.arl","j1", a)
```

### variant: 基本写法
### variant_en: Basic
signature: bool savejointnow(uint channel, string file_name, string pose_name, joint j)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| channel | uint | * |  |  | 1,2,3 | 前台通道号 | foreground channel |
| file_name | string | * |  |  | "prog1.arl" | 该通道加载的 arl 程序名 | loaded program |
| pose_name | string | * |  |  | "j1" | 存入文件的joint变量名称 | joint name in file |
| j | joint | * |  |  | j1 | 待存入的joint变量 | joint to save |

---

## connect
desc: TCP Socket连接

desc_en: TCP Socket connect

type: function

syntax: call

signature: bool connect(socket s, string ip, int port)

returns: bool

manual_ref: ARL V4.5.0：§5.6.1.3（manual p.144）

examples:

```arl
socket s
waituntil connect(s,"192.168.0.40",2888)
```

### variant: 基本写法
### variant_en: Basic
signature: bool connect(socket s, string ip, int port)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| s | socket | * |  |  | skt1,s1 | 套接字变量 | socket variable |
| ip | string | * |  |  | "192.168.1.2","192.168.2.2" | 目标IP地址 | host IP |
| port | int | * |  |  | 8888 | 端口号 | port |

---

## accept
desc: TCP Socket监听

desc_en: TCP Socket listen

type: function

syntax: call

signature: bool accept(socket s,string ip,int port)

returns: bool

manual_ref: ARL V4.5.0：§5.6.1.4（manual p.145）

examples:

```arl
socket s
waituntil accept(s,"192.168.0.40",2888)
```

### variant: 基本写法
### variant_en: Basic
signature: bool accept(socket s,string ip,int port)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| s | socket | * |  |  | skt1,s1 | 套接字变量 | socket variable |
| ip | string | * |  |  | "192.168.1.1","192.168.2.1" | 本机IP地址 | local IP address |
| port | int | * |  |  | 8888 | 端口号 | port |

---

## write
desc: 向 Socket、串口、Melsec、Modbus 设备写入数据

desc_en: Write to Socket, serial, Melsec or Modbus device

type: function

syntax: call

signature: bool write(socket s, string data)

returns: bool

manual_ref: ARL V4.5.0：§5.6.1.5（manual p.145）；§5.6.2.3（manual p.152）；§5.6.5.4（manual p.160）；§5.6.6.4（manual p.163）；§5.6.7.4（manual p.168）

examples:

```arl
socket s
waituntil connect(s,"192.168.0.40",2888)
waituntil write(s,"hello")
```

### variant: Socket 字符串
### variant_en: Socket string
signature: bool write(socket s, string data)
returns: bool
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| s | socket | * |  |  | s | Socket对象 | s |
| data | string | * |  |  |  | 数据变量 | data |

### variant: Socket 字节数组
### variant_en: Socket bytes
signature: bool write(socket s, byte[] data, int len)
returns: bool
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| s | socket | * |  |  | s | Socket对象 | s |
| data | byte[] | * |  |  |  | 数据变量 | data |
| len | int | * |  | 字节 | 1 | 长度 | len |

### variant: 串口字符串
### variant_en: Serial string
signature: bool write(iodev dev, string data)
returns: bool
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| dev | iodev | * |  |  | s | 已用 open 打开的串口设备 | serial device |
| data | string | * |  |  |  | 数据变量 | data |

### variant: 串口字节数组
### variant_en: Serial bytes
signature: bool write(iodev dev, byte[] data, int len)
returns: bool
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| dev | iodev | * |  |  | s | 已用 open 打开的串口设备 | serial device |
| data | byte[] | * |  |  |  | 数据变量 | data |
| len | int | * |  | 字节 | 1 | 长度 | len |

### variant: Melsec 字符串
### variant_en: Melsec string
signature: bool write(melsec_dev dev, string data, int start, [int len])
returns: bool
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| dev | melsec_dev | * |  |  |  | 通信设备 | dev |
| data | string | * |  |  |  | 数据变量 | data |
| start | int | * |  |  | 0 | 起始地址 | start |
| len | int |  |  | 字符 | 1 | 长度（字符个数）；省略时为字符串长度 | length in characters; defaults to string length |

### variant: Melsec 字节数组
### variant_en: Melsec bytes
signature: bool write(melsec_dev dev, byte[] data, int start, int len)
returns: bool
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| dev | melsec_dev | * |  |  |  | 通信设备 | dev |
| data | byte[] | * |  |  |  | 数据变量 | data |
| start | int | * |  |  | 0 | 起始地址 | start |
| len | int | * |  | 字节 | 1 | 长度 | len |

### variant: Modbus 从站字符串
### variant_en: Modbus slave string
signature: bool write(modbus_dev dev, string data, int start)
returns: bool
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| dev | modbus_dev | * |  |  |  | 通信设备 | dev |
| data | string | * |  |  |  | 数据变量 | data |
| start | int | * |  |  | 0 | 起始地址 | start |

### variant: Modbus 从站字节数组
### variant_en: Modbus slave bytes
signature: bool write(modbus_dev dev, byte[] data, int start, int len)
returns: bool
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| dev | modbus_dev | * |  |  |  | 通信设备 | dev |
| data | byte[] | * |  |  |  | 数据变量 | data |
| start | int | * |  |  | 0 | 起始地址 | start |
| len | int | * |  | 字节 | 1 | 长度 | len |

### variant: Modbus RTU 主站字符串
### variant_en: Modbus RTU master string
signature: bool write(modbus_rtu_master dev, string data, int start)
returns: bool
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| dev | modbus_rtu_master | * |  |  |  | 通信设备 | dev |
| data | string | * |  |  |  | 数据变量 | data |
| start | int | * |  |  | 0 | 起始地址 | start |

### variant: Modbus RTU 主站字节数组
### variant_en: Modbus RTU master bytes
signature: bool write(modbus_rtu_master dev, byte[] data, int start, int len)
returns: bool
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| dev | modbus_rtu_master | * |  |  |  | 通信设备 | dev |
| data | byte[] | * |  |  |  | 数据变量 | data |
| start | int | * |  |  | 0 | 起始地址 | start |
| len | int | * | <=246 | 字节 | 1 | 长度；单次最多写 246 字节 | len |

wizard:

| 预设 | preset_en | 变体 | 选用参数 |
|---|---|---|---|
| Socket 字符串 | Socket string | Socket 字符串 |  |
| Socket 字节数组 | Socket bytes | Socket 字节数组 |  |

notes:

- Melsec 读写的 len：data 为字符串时是字符个数，为字节数组时是字节个数（手册 §5.6.5.3～5.6.5.4 参数表）。

---

## syncwrite
desc: 同步Socket写入

desc_en: Sync Socket write

type: function

syntax: call

signature: bool syncwrite(socket s, string data)

returns: bool

manual_ref: ARL V4.5.0：§5.6.1.6（manual p.147）

examples:

```arl
socket s
waituntil connect(s,"192.168.0.40",2888)
syncwrite(s,"hello")
```

### variant: Socket 字符串
### variant_en: Socket string
signature: bool syncwrite(socket s, string data)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| s | socket | * |  |  | skt1,s1 | Socket对象 | socket |
| data | string | * |  |  | senddata | 要发送的数据 | data |

### variant: Socket 字节数组
### variant_en: Socket bytes
signature: bool syncwrite(socket s, byte[] data, int len)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| s | socket | * |  |  | skt1,s1 | Socket对象 | socket |
| data | byte[] | * |  |  | senddata | 要发送的字节组 | bytes to send |
| len | int | * |  |  | 1,2,3,4,5 | 字节组长度 | byte length |

wizard:

| 预设 | preset_en | 变体 | 选用参数 |
|---|---|---|---|
| Socket 字符串 | Socket string | Socket 字符串 |  |
| Socket 字节数组 | Socket bytes | Socket 字节数组 |  |

---

## read
desc: 从 Socket、串口、Melsec、Modbus 设备读取数据

desc_en: Read from Socket, serial, Melsec or Modbus device

type: function

syntax: call

signature: bool read(socket s, string data, int len)

returns: bool

manual_ref: ARL V4.5.0：§5.6.1.7（manual p.148）；§5.6.2.3（manual p.152）；§5.6.5.3（manual p.159）；§5.6.6.3（manual p.163）；§5.6.7.3（manual p.167）

examples:

```arl
socket s
waituntil connect(s,"192.168.0.40",2888)
string data
waituntil read(s,data,5)
```

### variant: Socket 字符串
### variant_en: Socket string
signature: bool read(socket s, string data, int len)
returns: bool
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| s | socket | * |  |  | s | Socket对象 | s |
| data | string | * |  |  |  | 接收数据的可写变量 | data |
| len | int | * |  | 字符 | 1 | 长度（字符个数） | length in characters |

### variant: Socket 字节数组
### variant_en: Socket bytes
signature: bool read(socket s, byte[] data, int len)
returns: bool
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| s | socket | * |  |  | s | Socket对象 | s |
| data | byte[] | * |  |  |  | 接收数据的可写变量 | data |
| len | int | * |  | 字节 | 1 | 长度 | len |

### variant: 串口字符串
### variant_en: Serial string
signature: bool read(iodev dev, string data, int len)
returns: bool
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| dev | iodev | * |  |  | s | 已用 open 打开的串口设备 | serial device |
| data | string | * |  |  |  | 接收数据的可写变量 | data |
| len | int | * |  | 字符 | 1 | 长度（字符个数） | length in characters |

### variant: 串口字节数组
### variant_en: Serial bytes
signature: bool read(iodev dev, byte[] data, int len)
returns: bool
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| dev | iodev | * |  |  | s | 已用 open 打开的串口设备 | serial device |
| data | byte[] | * |  |  |  | 接收数据的可写变量 | data |
| len | int | * |  | 字节 | 1 | 长度 | len |

### variant: Melsec 字符串
### variant_en: Melsec string
signature: bool read(melsec_dev dev, string data, int start, int len)
returns: bool
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| dev | melsec_dev | * |  |  |  | 通信设备 | dev |
| data | string | * |  |  |  | 接收数据的可写变量 | data |
| start | int | * |  |  | 0 | 起始地址 | start |
| len | int | * |  | 字符 | 1 | 长度（字符个数） | length in characters |

### variant: Melsec 字节数组
### variant_en: Melsec bytes
signature: bool read(melsec_dev dev, byte[] data, int start, int len)
returns: bool
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| dev | melsec_dev | * |  |  |  | 通信设备 | dev |
| data | byte[] | * |  |  |  | 接收数据的可写变量 | data |
| start | int | * |  |  | 0 | 起始地址 | start |
| len | int | * |  | 字节 | 1 | 长度 | len |

### variant: Modbus 从站字符串
### variant_en: Modbus slave string
signature: bool read(modbus_dev dev, string data, int start, int len)
returns: bool
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| dev | modbus_dev | * |  |  |  | 通信设备 | dev |
| data | string | * |  |  |  | 接收数据的可写变量 | data |
| start | int | * |  |  | 0 | 起始地址 | start |
| len | int | * |  | 字节 | 1 | 长度 | len |

### variant: Modbus 从站字节数组
### variant_en: Modbus slave bytes
signature: bool read(modbus_dev dev, byte[] data, int start, int len)
returns: bool
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| dev | modbus_dev | * |  |  |  | 通信设备 | dev |
| data | byte[] | * |  |  |  | 接收数据的可写变量 | data |
| start | int | * |  |  | 0 | 起始地址 | start |
| len | int | * |  | 字节 | 1 | 长度 | len |

### variant: Modbus RTU 主站字符串
### variant_en: Modbus RTU master string
signature: bool read(modbus_rtu_master dev, string data, int start, int len)
returns: bool
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| dev | modbus_rtu_master | * |  |  |  | 通信设备 | dev |
| data | string | * |  |  |  | 接收数据的可写变量 | data |
| start | int | * |  |  | 0 | 起始地址 | start |
| len | int | * | <=250 | 字节 | 1 | 长度；单次最多读 250 字节 | len |

### variant: Modbus RTU 主站字节数组
### variant_en: Modbus RTU master bytes
signature: bool read(modbus_rtu_master dev, byte[] data, int start, int len)
returns: bool
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| dev | modbus_rtu_master | * |  |  |  | 通信设备 | dev |
| data | byte[] | * |  |  |  | 接收数据的可写变量 | data |
| start | int | * |  |  | 0 | 起始地址 | start |
| len | int | * | <=250 | 字节 | 1 | 长度；单次最多读 250 字节 | len |

wizard:

| 预设 | preset_en | 变体 | 选用参数 |
|---|---|---|---|
| Socket 字符串 | Socket string | Socket 字符串 |  |
| Socket 字节数组 | Socket bytes | Socket 字节数组 |  |

---

## readuntil
desc: 读取到分隔符

desc_en: Read until delimiter

type: function

syntax: call

signature: bool readuntil(socket s, string data, string cut)

returns: bool

manual_ref: ARL V4.5.0：§5.6.1.8（manual p.149）；§5.6.2.3（manual p.152）

examples:

```arl
socket s
waituntil connect(s,"192.168.0.40",2888)
string data
waituntil readuntil(s, data, "e")
```

### variant: Socket
### variant_en: Socket
signature: bool readuntil(socket s, string data, string cut)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| s | socket | * |  |  | skt1,s1 | Socket对象 | socket |
| data | string | * |  |  | recdata | 接收存储字符数据 | received string buffer |
| cut | string | * |  |  | "#" | 终止符 | delimiter |

### variant: 串口
### variant_en: Serial
signature: bool readuntil(iodev dev, string data, string cut)
returns: bool
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| dev | iodev | * |  |  | s | 已用 open 打开的串口设备 | serial device |
| data | string | * |  |  | recdata | 接收存储字符数据 | received string buffer |
| cut | string | * |  |  | "#" | 终止符 | delimiter |

wizard:

| 预设 | preset_en | 变体 | 选用参数 |
|---|---|---|---|
| Socket | Socket | Socket |  |

---

## clearbuff
desc: 清空缓冲区

desc_en: Clear buffer

type: function

syntax: call

signature: bool clearbuff(socket s)

returns: bool

manual_ref: ARL V4.5.0：§5.6.1.9（manual p.150）；§5.6.2.4（manual p.153）；§5.6.6.5（manual p.164）

examples:

```arl
modbus_dev m
open(m,"rtserMB0",1,115200,8,1,none)
string data
clearbuff(m)
```

### variant: Socket
### variant_en: Socket
signature: bool clearbuff(socket s)
returns: bool
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| s | socket | * |  |  | s | Socket对象 | s |

### variant: 串口
### variant_en: Serial
signature: bool clearbuff(iodev& dev)
returns: bool
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| dev | iodev | * |  |  |  | 通信设备 | dev |

### variant: Modbus 从站
### variant_en: Modbus slave
signature: bool clearbuff(modbus_dev dev)
returns: bool
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| dev | modbus_dev | * |  |  |  | 通信设备 | dev |

wizard:

| 预设 | preset_en | 变体 | 选用参数 |
|---|---|---|---|
| Socket | Socket | Socket |  |

---

## geterror
desc: 获取 socket 的错误状态，用于断线重连；1 表示已断线，0 表示未断线

desc_en: Get socket error state for reconnection; 1 = disconnected, 0 = connected

type: function

syntax: call

signature: int geterror(socket s)

returns: int

return_constraint: 1 表示已断线（与 $ERR_SOCK_CLOSED 相等），0 表示未断线

manual_ref: ARL V4.5.0：§5.6.1.5 socket 断线重连（manual p.146~147）；§5.6.1.7（manual p.149）；原型与返回值由用户确认

verification: confirmed-user-correction

examples:

```arl
$DETECT_SOCK_CLOSE = true
interrupt 1,when:geterror(s)==$ERR_SOCK_CLOSED,do:handler()
```

### variant: 基本写法
### variant_en: Basic
signature: int geterror(socket s)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| s | socket | * |  |  | s | 要查询的套接字变量 | socket |

notes:

- 须先设置 `$DETECT_SOCK_CLOSE = true`；否则 socket 断开时系统报警并停止运行。
- 断线重连时不宜使用定时中断 timer 和 clearbuff，它们会影响断线检测，建议用 while 加 waittime 代替 timer。
- 机器人作为 Server 时，重连处理函数中要先 close(s) 再 accept。

---

## open
desc: 打开串口 / Modbus / Melsec 设备

desc_en: Open serial / Modbus / Melsec device

type: function

syntax: call

signature: bool open(iodev& dev, string devname, int baud_rate, int character_size, stopbits stop_bits, parity prt)

returns: bool

manual_ref: ARL V4.5.0：§5.6.2.1（manual p.150）；§5.6.5.1（manual p.158）；§5.6.6.1（manual p.161）；§5.6.7.1（manual p.165）

verification: confirmed-user-correction

examples:

```arl
iodev s
open(s,"/dev/ttyS0",9600,8,one,none)
```

### variant: 串口
### variant_en: Serial
signature: bool open(iodev& dev, string devname, int baud_rate, int character_size, stopbits stop_bits, parity prt)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| dev | iodev | * |  |  | s | 预先定义好的IO设备 | IO device |
| devname | string | * | "/dev/ttyS0","/dev/ttyS1" |  | "/dev/ttyS0","/dev/ttyS1" | 设备名（/dev/ttyS0 为 com1，/dev/ttyS1 为 com2） | device name |
| baud_rate | int | * | 300,600,1200,2400,4800,9600,19200,38400,57600,115200 | bps | 9600,115200 | 波特率 | baud rate |
| character_size | int | * | 7,8 |  | 8,7 | 字符大小 | character size |
| stop_bits | stopbits | * | one,two |  | one,two | 停止位 | stop bits |
| prt | parity | * | none,odd,even |  | none,odd,even | 奇偶校验 | parity |

### variant: Modbus 从站
### variant_en: Modbus slave
signature: bool open(modbus_dev dev, string devname, int slave_id, int baud_rate, int databits, StopBitType stop_bits, ParityType parity)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| dev | modbus_dev | * |  |  | m | modbus设备 | Modbus device |
| devname | string | * | "rtserMB0","/dev/ttyS0" |  | "rtserMB0","/dev/ttyS0" | 设备名 | device name |
| slave_id | int | * | 1~247 |  | 1,2,3 | 站号 | slave ID |
| baud_rate | int | * | 4800,9600,19200,38400,57600,115200 |  | 115200,4800,9600,19200,38400,57600 | 波特率 | baud rate |
| databits | int | * | 8 |  | 8 | 数据位 | data bits |
| stop_bits | StopBitType | * | 1,2 |  | 1,2 | Modbus 停止位类型；不同于串口 stopbits | Modbus stop-bit type; distinct from serial stopbits |
| parity | ParityType | * | none,odd,even |  | none,odd,even | Modbus 奇偶校验类型；不同于串口 parity | Modbus parity type; distinct from serial parity |

### variant: Modbus RTU 主站
### variant_en: Modbus RTU master
signature: bool open(modbus_rtu_master dev, string devname, int slave_id, int baud_rate, int databits, StopBitType stop_bits, ParityType parity)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| dev | modbus_rtu_master | * |  |  | m | modbus RTU 主站设备 | Modbus RTU master device |
| devname | string | * |  |  | "/dev/ttyS0" | RTU主站：二代柜仅串口1 /dev/ttyS0 | second-generation cabinet master: serial port 1 only |
| slave_id | int | * | 1~247 |  | 1,2,3 | 站号 | slave ID |
| baud_rate | int | * | 4800,9600,19200,38400,57600,115200 |  | 115200,4800,9600,19200,38400,57600 | 波特率 | baud rate |
| databits | int | * | 8 |  | 8 | 数据位 | data bits |
| stop_bits | StopBitType | * | 1,2 |  | 1,2 | Modbus 停止位类型；不同于串口 stopbits | Modbus stop-bit type; distinct from serial stopbits |
| parity | ParityType | * | none,odd,even |  | none,odd,even | Modbus 奇偶校验类型；不同于串口 parity | Modbus parity type; distinct from serial parity |

### variant: Melsec
### variant_en: Melsec
signature: bool open(melsec_dev dev, string ip, int port, int slave_id)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| dev | melsec_dev | * |  |  | mc | 预先定义好的 melsec 套接字变量 | melsec device |
| ip | string | * |  |  | "192.168.1.101" | 设备IP | device IP |
| port | int | * |  |  | 8080 | 对方设备端口 | port |
| slave_id | int | * | 0~247；特殊值：255 |  | 255 | Melsec 从站号（0 为广播地址；TCP 模式下 255 恢复默认值） | slave ID |

wizard:

| 预设 | preset_en | 变体 | 选用参数 |
|---|---|---|---|
| Modbus 从站 | Modbus slave | Modbus 从站 |  |
| 串口 | Serial | 串口 |  |
| Modbus RTU 主站 | Modbus RTU master | Modbus RTU 主站 |  |
| Melsec | Melsec | Melsec |  |

notes:

- Modbus 从站、RTU 主站的 stop_bits（StopBitType）取 1 或 2，parity（ParityType）取 none、odd、even；手册参数表已给出全部取值，不另建类型条目（用户确认）。

---

## close
desc: 关闭已打开的 Socket、串口、Melsec 或 Modbus 设备

desc_en: Close an open Socket, serial, Melsec or Modbus device

type: function

syntax: call

signature: void close(socket s) / void close(iodev& dev) / void close(melsec_dev dev) / void close(modbus_dev& dev) / void close(modbus_rtu_master& dev)

returns: void

manual_ref: ARL V4.5.0：§5.6.2.2（manual p.151）；§5.6.5.2（manual p.159）；§5.6.6.2（manual p.162）；§5.6.7.2（manual p.166）；close(socket) 见 §5.6.1.5 断线重连示例（manual p.146），经用户在控制器确认，无返回值

verification: confirmed-user-correction

examples:

```arl
iodev s
open(s,"/dev/ttyS0",9600,8,one,none)
close(s)
```

### variant: Socket
### variant_en: Socket
signature: void close(socket s)
returns: void
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| s | socket | * |  |  |  | Socket 对象；控制器确认可关闭 | Socket object; controller-confirmed close |

### variant: 串口
### variant_en: Serial
signature: void close(iodev& dev)
returns: void
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| dev | iodev | * |  |  |  | 通信设备 | dev |

### variant: Melsec
### variant_en: Melsec
signature: void close(melsec_dev dev)
returns: void
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| dev | melsec_dev | * |  |  |  | 通信设备 | dev |

### variant: Modbus 从站
### variant_en: Modbus slave
signature: void close(modbus_dev& dev)
returns: void
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| dev | modbus_dev | * |  |  |  | 通信设备 | dev |

### variant: Modbus RTU 主站
### variant_en: Modbus RTU master
signature: void close(modbus_rtu_master& dev)
returns: void
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| dev | modbus_rtu_master | * |  |  |  | 通信设备 | dev |

wizard:

| 预设 | preset_en | 变体 | 选用参数 |
|---|---|---|---|
| Socket | Socket | Socket |  |

---

## dnwrite
desc: 向DeviceNet总线写数据

desc_en: Write to DeviceNet bus

type: function

syntax: call

signature: int dnwrite(int offset, int len, byte[] data)

returns: int

return_constraint: 0 表示成功，非 0 为错误码

manual_ref: ARL V4.5.0：§5.6.3.1（manual p.153）

examples:

```arl
byte bdata[3] = {1,2,3}
dnwrite(0,3,bdata)
```

### variant: 基本写法
### variant_en: Basic
signature: int dnwrite(int offset, int len, byte[] data)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| offset | int | * |  |  |  | 起始字节偏移地址 | offset |
| len | int | * |  | 字节 | 3 | 数据长度 | data len |
| data | byte[] | * |  |  |  | 数据数组 | data[] |

---

## dnread
desc: 从DeviceNet总线读数据

desc_en: Read from DeviceNet bus

type: function

syntax: call

signature: int dnread(int offset, int len, byte[] data)

returns: int

return_constraint: 0 表示成功，非 0 为错误码

manual_ref: ARL V4.5.0：§5.6.3.2（manual p.154）

examples:

```arl
byte bdata[3]
dnread(0,3,bdata)
```

### variant: 基本写法
### variant_en: Basic
signature: int dnread(int offset, int len, byte[] data)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| offset | int | * |  |  |  | 起始字节偏移地址 | offset |
| len | int | * |  | 字节 | 3 | 数据长度 | data len |
| data | byte[] | * |  |  |  | 接收数组 | data out |

---

## readregisters
desc: 读 ModbusTCP 寄存器

desc_en: Read Modbus registers

type: function

syntax: call

signature: bool readregisters(int data, int start, [int is_bigend]) / bool readregisters(double data, int start) / bool readregisters(string data, int start, int len) / bool readregisters(byte[] data, int start, int len)

returns: bool

manual_ref: ARL V4.5.0：§5.6.4.1（字符串/字节，manual p.155）；§5.6.4.3（int/double，manual p.156）

examples:

```arl
byte bdata[4]
waituntil readregisters(bdata,100,2)
```

### variant: 整型读取
### variant_en: Integer read
signature: bool readregisters(int data, int start, [int is_bigend])
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| data | int | * |  |  | recdata | 接收变量 | output variable |
| start | int | * |  |  | 0,1,2,3 | 起始寄存器地址 | start reg |
| is_bigend | int |  | 0,1 |  | 0,1 | 小端/大端 | little/big endian |

### variant: 浮点读取
### variant_en: Float read
signature: bool readregisters(double data, int start)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| data | double | * |  |  | recdata | 接收变量 | output variable |
| start | int | * |  |  | 0,1,2,3 | 起始寄存器地址 | start reg |

### variant: 字符串读取
### variant_en: String read
signature: bool readregisters(string data, int start, int len)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| data | string | * |  |  | recdata | 接收变量 | output variable |
| start | int | * |  |  | 0,1,2,3 | 起始寄存器地址 | start reg |
| len | int | * |  | 寄存器 | 2,4 | 读取长度 | read len |

### variant: 字节读取
### variant_en: Byte read
signature: bool readregisters(byte[] data, int start, int len)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| data | byte[] | * |  |  | recdata | 接收数组 | output array |
| start | int | * |  |  | 0,1,2,3 | 起始寄存器地址 | start reg |
| len | int | * |  | 寄存器 | 2,4 | 读取长度 | read len |

wizard:

| 预设 | preset_en | 变体 | 选用参数 |
|---|---|---|---|
| 整型读取 | Integer read | 整型读取 |  |
| 浮点读取 | Float read | 浮点读取 |  |
| 字符串读取 | String read | 字符串读取 |  |
| 字节读取 | Byte read | 字节读取 |  |

---

## writeregisters
desc: 写 ModbusTCP 寄存器

desc_en: Write Modbus registers

type: function

syntax: call

signature: bool writeregisters(string data, int start) / bool writeregisters(byte[] data, int start, int len) / bool writeregisters(double data, int start) / bool writeregisters(int data, int start, [int is_bigend])

returns: bool

manual_ref: ARL V4.5.0：§5.6.4.2（字符串/字节，manual p.155）；§5.6.4.4（int/double，manual p.157）；用户确认的五种写法以四个变体表达，整型的字节序参数可选

verification: confirmed-user-correction

examples:

```arl
byte bdata[4] = {1,2,3,4}
waituntil writeregisters(bdata,100,2)
```

### variant: 整型写入
### variant_en: Integer write
signature: bool writeregisters(int data, int start, [int is_bigend])
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| data | int | * |  |  | senddata | 写入数据 | data |
| start | int | * |  |  | 0,1,2,3 | 起始寄存器地址 | start reg |
| is_bigend | int |  | 0,1 |  | 0,1 | 可选字节序：小端/大端 | optional little/big endian |

### variant: 浮点写入
### variant_en: Float write
signature: bool writeregisters(double data, int start)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| data | double | * |  |  | senddata | 写入浮点数据 | float data to write |
| start | int | * |  |  | 0,1,2,3 | 起始寄存器地址 | start reg |

### variant: 字节写入
### variant_en: Byte write
signature: bool writeregisters(byte[] data, int start, int len)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| data | byte[] | * |  |  | senddata | 写入字节数据 | bytes to write |
| start | int | * |  |  | 0,1,2,3 | 起始寄存器地址 | start reg |
| len | int | * |  | 寄存器 | 2,4 | 写入长度 | write len |

### variant: 字符串写入
### variant_en: String write
signature: bool writeregisters(string data, int start)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| data | string | * |  |  | senddata | 写入字符数据 | string data to write |
| start | int | * |  |  | 0,1,2,3 | 起始寄存器地址 | start reg |

wizard:

| 预设 | preset_en | 变体 | 选用参数 |
|---|---|---|---|
| 整型写入 | Integer write | 整型写入 |  |
| 浮点写入 | Float write | 浮点写入 |  |
| 字节写入 | Byte write | 字节写入 |  |
| 字符串写入 | String write | 字符串写入 |  |

notes:

- 写字符串只有 `(string data, int start)` 两个参数（用户确认，与手册 §5.6.4.2 原型一致）；手册示例 `writeregisters(s,200,2)` 多写了一个参数，有误。

---

## readcoils
desc: 读Modbus线圈状态

desc_en: Read Modbus coils

type: function

syntax: call

signature: bool readcoils(byte[] data, int start, int length)

returns: bool

manual_ref: ARL V4.5.0：§5.6.4.5（manual p.157）

examples:

```arl
byte bdata[2]
waituntil readcoils(bdata,100,16)
```

### variant: 基本写法
### variant_en: Basic
signature: bool readcoils(byte[] data, int start, int length)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| data | byte[] | * |  |  | recdata | 接收数组 | data out |
| start | int | * |  |  | 0,1,2,3 | 起始线圈地址 | start coil |
| length | int | * |  | 位 | 1,2,3,4 | 读取长度 | read len |

---

## writecoils
desc: 写Modbus线圈

desc_en: Write Modbus coils

type: function

syntax: call

signature: bool writecoils(byte[] data, int start, int length)

returns: bool

manual_ref: ARL V4.5.0：§5.6.4.6（manual p.158）

examples:

```arl
byte bdata[2] = {1,2}
waituntil writecoils(bdata,100,16)
```

### variant: 基本写法
### variant_en: Basic
signature: bool writecoils(byte[] data, int start, int length)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| data | byte[] | * |  |  | senddata | 写入数据 | data |
| start | int | * |  |  | 0,1,2,3 | 起始线圈地址 | start coil |
| length | int | * |  | 位 | 1,2,3,4 | 写入长度 | write len |

---

## clkstart
desc: 启动时钟计时

desc_en: Start clock

type: function

syntax: call

signature: void clkstart(clock &c)

returns: void

manual_ref: ARL V4.5.0：§5.3.2（manual p.128）

examples:

```arl
clock c
clkstart(c)
```

### variant: 基本写法
### variant_en: Basic
signature: void clkstart(clock &c)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| c | clock | * |  |  | c,c1,c2 | 时钟变量 | clock |

---

## clkstop
desc: 停止时钟计时

desc_en: Stop clock

type: function

syntax: call

signature: void clkstop(clock &c)

returns: void

manual_ref: ARL V4.5.0：§5.3.3（manual p.128）

examples:

```arl
clock c
clkstart(c)
clkstop(c)
```

### variant: 基本写法
### variant_en: Basic
signature: void clkstop(clock &c)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| c | clock | * |  |  | c,c1,c2 | 时钟变量 | clock |

---

## clkreset
desc: 时钟清零

desc_en: Reset clock

type: function

syntax: call

signature: void clkreset(clock &c)

returns: void

manual_ref: ARL V4.5.0：§5.3.4（manual p.129）

examples:

```arl
clock c
clkreset(c)
```

### variant: 基本写法
### variant_en: Basic
signature: void clkreset(clock &c)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| c | clock | * |  |  | c,c1,c2 | 时钟变量 | clock |

---

## clkread
desc: 读取时钟当前数值

desc_en: Read clock value

type: function

syntax: call

signature: double clkread(clock &c)

returns: double

manual_ref: ARL V4.5.0：§5.3.5（manual p.129）

examples:

```arl
clock c
clkstart(c)
waittime 3
clkstop(c)
print clkread(c)
```

### variant: 基本写法
### variant_en: Basic
signature: double clkread(clock &c)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| c | clock | * |  |  | c,c1,c2 | 时钟变量 | clock |

---

## T
desc: 判断当前运动轨迹是否已到达距起点指定时间点

desc_en: Whether current trajectory has reached a specified time from start

type: function

syntax: call

signature: bool T(double t)

returns: bool

manual_ref: ARL V4.5.0：§5.10.1（manual p.201）

examples:

```arl
trigger 1,when:T(1),do:setdo(1,true)
```

### variant: 基本写法
### variant_en: Basic
signature: bool T(double t)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| t | double | * |  | s | 1 | 时间点 | time |

notes:

- 精度不如 P()，轨迹触发推荐改用 P()（用户说明）。
- 按 100% 倍率计时：倍率不是 100% 时，触发点的位置不变，实际经过的时间与指定时间不同（手册 §7.3）。
- 暂停或急停后失效（手册 §7.3）。

---

## S
desc: 判断当前运动轨迹是否已到达距起点指定路程点

desc_en: Whether current trajectory has reached a specified distance from start

type: function

syntax: call

signature: bool S(double s)

returns: bool

manual_ref: ARL V4.5.0：§5.10.2（manual p.202）

examples:

```arl
trigger 1,when:S(100),do:setdo(1,true)
```

### variant: 基本写法
### variant_en: Basic
signature: bool S(double s)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| s | double | * |  | mm | 100 | 距离值 | distance |

notes:

- 精度不如 P()，轨迹触发推荐改用 P()（用户说明）。

---

## P
desc: 判断轨迹起点到终点经过的百分比

desc_en: Whether current trajectory has reached a percentage distance from start

type: function

syntax: call

signature: bool P(double p)

returns: bool

manual_ref: ARL V4.5.0：§7.2（manual p.227）提及 P；函数形式及 double 参数按用户补充

verification: confirmed-user-correction

examples:

```arl
trigger 1,when:P(50),do:setdo(1,true)
```

### variant: 基本写法
### variant_en: Basic
signature: bool P(double p)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| p | double | * |  | % | 50,0,100 | 距离百分比 | percent of distance |

notes:

- 轨迹触发（并行写法、trigger）推荐使用 P()；T()、S()、StoEnd() 精度较差（用户说明）。

---

## StoEnd
desc: 判断当前运动轨迹是否已到达距目标点指定剩余距离处

desc_en: Whether current trajectory has reached a specified remaining distance to target

type: function

syntax: call

signature: bool StoEnd(double s)

returns: bool

manual_ref: ARL V4.5.0：§5.10.3（manual p.202）

examples:

```arl
trigger 1,when:StoEnd(100),do:setdo(1,true)
```

### variant: 基本写法
### variant_en: Basic
signature: bool StoEnd(double s)
| 参数 | 类型 | 必填 | 取值/约束 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| s | double | * |  | mm | 100 | 距离值 | distance |

notes:

- 精度不如 P()，轨迹触发推荐改用 P()（用户说明）。

---

# ═══ 特殊关键字 (Keywords) ═══

## const
desc: 声明常量，值不可修改

desc_en: Declare constant (immutable)

type: keyword

syntax: modifier

signature: const <类型> <名称> = <值>

manual_ref: ARL V4.5.0：变量与运算 / 常量（manual p.7）


examples:

```arl
const double pi = 3.1415926
```

---

## func
desc: 声明用户自定义函数

desc_en: Declare user-defined function

type: keyword

syntax: block

close: endfunc

signature: func <返回类型> <函数名>(<参数列表>)

manual_ref: ARL V4.5.0：ARL 概述 / 函数（manual p.2）


examples:

```arl
func int add(int x,int y)
    return x+y
endfunc
```

---

## endfunc
desc: 结束函数定义块

desc_en: End function block

type: keyword

syntax: terminator

parent: func

signature: endfunc

manual_ref: ARL V4.5.0：ARL 概述 / 函数（manual p.2）

---

# ═══ 数据类型 (Data Types) ═══

## int
desc: 整数类型

desc_en: integer type

type: datatype

syntax: type

signature: int

manual_ref: ARL V4.5.0：§2.3.1（manual p.8）

---

## uint
desc: 无符号整数类型

desc_en: unsigned integer type

type: datatype

syntax: type

signature: uint

manual_ref: ARL V4.5.0：§2.3.2（manual p.8）

---

## byte
desc: 字节类型

desc_en: byte type

type: datatype

syntax: type

signature: byte

manual_ref: ARL V4.5.0：§2.3.3（manual p.8）

---

## double
desc: 浮点数类型

desc_en: Double-precision floating-point type

type: datatype

syntax: type

signature: double

manual_ref: ARL V4.5.0：§2.3.4（manual p.9）

---

## bool
desc: 布尔类型（true/false）

desc_en: Boolean type (true/false)

type: datatype

syntax: type

signature: bool

manual_ref: ARL V4.5.0：§2.3.5（manual p.9）

---

## string
desc: 字符串类型

desc_en: String type

type: datatype

syntax: type

signature: string

manual_ref: ARL V4.5.0：§2.3.6（manual p.9）

---

## pos
desc: 三维坐标类型

desc_en: 3D position type

type: datatype

syntax: type

signature: pos

kind: struct

manual_ref: ARL V4.5.0：§2.4.2（manual p.12）；§2.5.2（manual p.31）


examples:

```arl
pos p1 = {0,0,0}
p1.x = p1.x + 50
```

members:

| 成员 | 类型 | 单位 | 说明 | desc_en |
|---|---|---|---|---|
| x | double | mm | X坐标 | x |
| y | double | mm | Y坐标 | y |
| z | double | mm | Z坐标 | z |

---

## frame
desc: 坐标系类型

desc_en: Coordinate frame type

type: datatype

syntax: type

signature: frame

kind: struct

manual_ref: ARL V4.5.0：§2.4.3（manual p.13）；§2.5.3（manual p.32）


examples:

```arl
frame f = {10,10,0,0,90,0}
```

members:

| 成员 | 类型 | 单位 | 说明 | desc_en |
|---|---|---|---|---|
| x | double | mm | 平移x | x |
| y | double | mm | 平移y | y |
| z | double | mm | 平移z | z |
| a | double | ° | 欧拉角a | a |
| b | double | ° | 欧拉角b | b |
| c | double | ° | 欧拉角c | c |

---

## pose
desc: 位姿类型（位置+姿态）

desc_en: pose type (position + orientation)

type: datatype

syntax: type

signature: pose

kind: struct

manual_ref: ARL V4.5.0：§2.4.4（manual p.14）；§2.5.4（manual p.33）；成员表按六轴 §2.4.4，SCARA 版成员不同


examples:

```arl
pose p1 = {x 0,y 10,z 15,a 0,b 90,c 0,cfg 0,ej1 20}
```

members:

| 成员 | 类型 | 单位 | 说明 | desc_en |
|---|---|---|---|---|
| x | double | mm | 位置x | x |
| y | double | mm | 位置y | y |
| z | double | mm | 位置z | z |
| a | double | ° | 欧拉角a | a |
| b | double | ° | 欧拉角b | b |
| c | double | ° | 欧拉角c | c |
| cfg | int |  | 轴配置，取值 -1~7，-1 为自动选解 | cfg |
| t4 | int |  | 4 轴角度区间：0 自动选解，1 为 0°~180°，-1 为 -180°~0°，每增减 1 移动 180° | t4 |
| t6 | int |  | 6 轴角度区间：0 自动选解，1 为 0°~180°，-1 为 -180°~0°，每增减 1 移动 180° | t6 |
| ej1 | double | mm/° | 外轴1位置 | ej1 |
| ej2 | double | mm/° | 外轴2位置 | ej2 |
| ej3 | double | mm/° | 外轴3位置 | ej3 |
| ej4 | double | mm/° | 外轴4位置 | ej4 |
| ej5 | double | mm/° | 外轴5位置 | ej5 |
| ej6 | double | mm/° | 外轴6位置 | ej6 |

---

## joint
desc: 关节角度类型

desc_en: Joint angle type

type: datatype

syntax: type

signature: joint

kind: struct

manual_ref: ARL V4.5.0：§2.4.5（manual p.16）；§2.5.5（manual p.35）；成员表按六轴 §2.4.5，SCARA 版成员不同


examples:

```arl
joint p1 = {j1 0,j3 15,j5 0,ej1 20}
```

members:

| 成员 | 类型 | 单位 | 说明 | desc_en |
|---|---|---|---|---|
| j1 | double | ° | 机器人1轴位置 | j1 |
| j2 | double | ° | 机器人2轴位置 | j2 |
| j3 | double | ° | 机器人3轴位置 | j3 |
| j4 | double | ° | 机器人4轴位置 | j4 |
| j5 | double | ° | 机器人5轴位置 | j5 |
| j6 | double | ° | 机器人6轴位置 | j6 |
| ej1 | double | mm/° | 外轴1位置 | ej1 |
| ej2 | double | mm/° | 外轴2位置 | ej2 |
| ej3 | double | mm/° | 外轴3位置 | ej3 |
| ej4 | double | mm/° | 外轴4位置 | ej4 |
| ej5 | double | mm/° | 外轴5位置 | ej5 |
| ej6 | double | mm/° | 外轴6位置 | ej6 |

---

## tool
desc: 工具坐标系类型

desc_en: Tool coordinate frame type

type: datatype

syntax: type

signature: tool

kind: struct

manual_ref: ARL V4.5.0：§2.4.6（manual p.17）；§2.5.6（manual p.36）；成员表按六轴 §2.4.6，SCARA 版成员不同


examples:

```arl
frame f = {10,10,0,0,90,0}
tool t1
t1.t_frame = f
t1.stationary = false
```

members:

| 成员 | 类型 | 单位 | 说明 | desc_en |
|---|---|---|---|---|
| t_frame | frame |  | 工具坐标系 | t_frame |
| stationary | bool |  | 是否外部固定工具 | stationary |
| mu_name | string |  | 机械单元名称 | mu_name |

---

## wobj
desc: 工件坐标系类型

desc_en: Work object coordinate frame type

type: datatype

syntax: type

signature: wobj

kind: struct

manual_ref: ARL V4.5.0：§2.4.7（manual p.18）；§2.5.7（manual p.36）


examples:

```arl
frame f = {10,10,0,0,90,0}
wobj w1
w1.w_frame = f
```

members:

| 成员 | 类型 | 单位 | 说明 | desc_en |
|---|---|---|---|---|
| w_frame | frame |  | 工件坐标系 | w_frame |
| robhold | bool |  | 是否由机器人抓取 | robhold |
| mu_name | string |  | 机械单元名称 | mu_name |

---

## weavedata
desc: 摆动图形参数结构体类型

desc_en: Weave data type

type: datatype

syntax: type

signature: weavedata

kind: struct

manual_ref: ARL V4.5.0：§2.4.8（manual p.19）

verification: confirmed-user-correction

examples:

```arl
const weavedata weave1 = { weave_type 0, frequency 1, amplitude 5, amplitude_left 0, amplitude_right 0, dwell_right 2, dwell_left 1, dwell_middle 1, track false, vibrat false, swing_angle 2, radius 0, axis 0, rotation_angle 3 }
```

members:

| 成员 | 类型 | 单位 | 说明 | desc_en |
|---|---|---|---|---|
| weave_type | weaveshape |  | 摆动类型；可写枚举名或整数（0 为 simple） | weave type |
| frequency | double | Hz | 循环频率 | frequency |
| amplitude | double | mm | 摆动振幅 | amplitude |
| amplitude_left | double | mm | 左振幅 | amplitude_left |
| amplitude_right | double | mm | 右振幅 | amplitude_right |
| dwell_right | double | s/mm | 右停留时长（循环类型为频率时，s）或距离（为波长时，mm）；最小 0 | dwell_right |
| dwell_left | double | s/mm | 左停留时长（循环类型为频率时，s）或距离（为波长时，mm）；最小 0 | dwell_left |
| dwell_middle | double | s/mm | 中心停留时长（循环类型为频率时，s）或距离（为波长时，mm）；最小 0 | dwell_middle |
| track | bool |  | 是否焊缝跟踪 | track |
| vibrat | bool |  | 是否起振 | vibrat |
| swing_angle | double | ° | 空间摆动角度 | swing_angle |
| radius | double | mm | 图形半径 | radius |
| axis | weaverotaxis |  | 摆动平面偏转参考轴；可写枚举名或整数（0 为 rot_x） | rotation axis |
| rotation_angle | double | ° | 摆动平面偏转角 | rotation_angle |

notes:

- 手册 §2.4.8 示例 `weavedata weavedatalin1 = {2,15,1,1,0,true}` 按位置对应时，第 6 位 dwell_right（double）得到 `true`，类型不匹配，加载会报错（用户确认）；该例不作为推荐写法。
- 成员名以控制器生成的程序为准（用户提供，即上方示例）：`weave_type`、`axis`；手册 §2.4.8 成员表写的 weaveshape、weaverotaxis 是它们的类型名。
- 成员表按控制器生成的顺序排列（用户确认），与手册 §2.4.8 的定义顺序不同：dwell_right 在 dwell_left 之前，vibrat 紧跟 track。按位置初始化以此为准；写成员名时顺序不影响。
- weaveshape、weaverotaxis、startweave、endweave 条目中手册按位置写的示例同样不符，已改为写成员名（用户确认手册按位置写的摆动示例有误）。

---

## speed
desc: 速度数据类型

desc_en: Speed data type

type: datatype

syntax: type

signature: speed

kind: struct

manual_ref: ARL V4.5.0：§2.4.9（manual p.21）；§2.5.8（manual p.37）


examples:

```arl
speed v = {per 10}
```

members:

| 成员 | 类型 | 单位 | 说明 | desc_en |
|---|---|---|---|---|
| per | double | % | 速度百分比，movej、ptp 使用；取值 0.001~100 | per |
| tcp | double | mm/s | TCP平动速度，lin、cir 使用；上限随机型：AIR4/6L/7L/10/20 为 2500，AIR50、165 为 1300 | tcp |
| ori | double | °/s | 姿态角速度，lin、cir 使用；上限随机型：AIR4/6L/7L/10/20 为 500，AIR50、165 为 250 | ori |
| exj | double | °/s | 旋转外轴速度 | exj |
| exl | double | mm/s | 直线外轴速度 | exl |

---

## slip
desc: 平滑过渡数据类型

desc_en: slip data type

type: datatype

syntax: type

signature: slip

kind: struct

manual_ref: ARL V4.5.0：§2.4.10（manual p.22）；§2.5.9（manual p.38）；成员表按六轴 §2.4.10，SCARA 版成员不同，成员顺序也不同

members:

| 成员 | 类型 | 单位 | 说明 | desc_en |
|---|---|---|---|---|
| perdis | double | % | 平滑百分比 | perdis |
| pdis | double | mm | 位置平滑距离 | pdis |
| odis | double | ° | 姿态平滑角度 | odis |
| ejdis | double | mm/° | 外轴平滑距离或角度 | ejdis |
| eldis | double | mm/° | 直线外轴平滑距离 | eldis |

notes:

- 各成员都是 double：0 表示不平滑（插补点不一定与目标点重合），小于 0 表示不平滑且准停（一定经过目标点）；没有上限，超出这段路径允许的最大平滑量时系统自动取最大可达值，不报错（用户确认）。
- 手册 §2.4.10 的示例 `slip s = {100,2,3,4,5,5}` 给出 6 个初始化值，但结构体定义和成员表均只有 5 个成员；该例不作为推荐写法。

---

## jvel
desc: 关节速度数据类型

desc_en: Joint velocity data type

type: datatype

syntax: type

signature: jvel

kind: struct

manual_ref: ARL V4.5.0：§2.4.11（manual p.24）；§2.5.10（manual p.39）；成员表按六轴 §2.4.11，SCARA 版成员不同

verification: confirmed-user-correction


examples:

```arl
jvel jvel1 = {jv1 1,jv3 2,ev1 3}
```

members:

| 成员 | 类型 | 单位 | 说明 | desc_en |
|---|---|---|---|---|
| jv1 | double | °/s | 机器人1轴速度 | jv1 |
| jv2 | double | °/s | 机器人2轴速度 | jv2 |
| jv3 | double | °/s | 机器人3轴速度 | jv3 |
| jv4 | double | °/s | 机器人4轴速度 | jv4 |
| jv5 | double | °/s | 机器人5轴速度 | jv5 |
| jv6 | double | °/s | 机器人6轴速度 | jv6 |
| ev1 | double | °/s | 外轴1速度 | ev1 |
| ev2 | double | °/s | 外轴2速度 | ev2 |
| ev3 | double | °/s | 外轴3速度 | ev3 |
| ev4 | double | °/s | 外轴4速度 | ev4 |
| ev5 | double | °/s | 外轴5速度 | ev5 |
| ev6 | double | °/s | 外轴6速度 | ev6 |

notes:

- 单位为 °/s（用户确认）。手册 §2.4.11 写作 rad/s 有误；§5.8.14 channeljointvel 的 °/s 正确。

---

## Centroid_Pos
desc: 工具负载质心结构体类型

desc_en: Tool-load centroid structure type

type: datatype

syntax: type

signature: Centroid_Pos

kind: struct

manual_ref: ARL V4.5.0：§2.4.12（manual p.25）

examples:

```arl
Centroid_Pos cen_pos = {10,20,30}
```

members:

| 成员 | 类型 | 单位 | 说明 | desc_en |
|---|---|---|---|---|
| x | double | mm | 工具负载质心 x 分量 | centroid x |
| y | double | mm | 工具负载质心 y 分量 | centroid y |
| z | double | mm | 工具负载质心 z 分量 | centroid z |



---

## Inertia_Tensor
desc: 工具负载惯性参数结构体类型

desc_en: Tool-load inertia tensor structure type

type: datatype

syntax: type

signature: Inertia_Tensor

kind: struct

manual_ref: ARL V4.5.0：§2.4.13（manual p.26）

examples:

```arl
Inertia_Tensor I_T = {10,20,30,40,50,60}
```

members:

| 成员 | 类型 | 单位 | 说明 | desc_en |
|---|---|---|---|---|
| Ixx | double | g*mm2 | 惯性矩阵 Ixx 分量 | inertia Ixx |
| Ixy | double | g*mm2 | 惯性矩阵 Ixy 分量 | inertia Ixy |
| Ixz | double | g*mm2 | 惯性矩阵 Ixz 分量 | inertia Ixz |
| Iyy | double | g*mm2 | 惯性矩阵 Iyy 分量 | inertia Iyy |
| Iyz | double | g*mm2 | 惯性矩阵 Iyz 分量 | inertia Iyz |
| Izz | double | g*mm2 | 惯性矩阵 Izz 分量 | inertia Izz |



---

## ToolInertiaPara
desc: 工具负载参数结构体类型

desc_en: Tool-load inertia parameter structure type

type: datatype

syntax: type

signature: ToolInertiaPara

kind: struct

manual_ref: ARL V4.5.0：§2.4.14（manual p.27）

verification: confirmed-user-correction

examples:

```arl
ToolInertiaPara tip
tip.m = 30
tip.centroid_pos = {15,25,100}
tip.Inertia_Tensor = {10,20,30,40,50,60}
```

手册定义行中的 `Centroid_Pos`、`Inertia_Tensor` 是类型名；`centroidpos`、`inertiatensor` 是示例成员标识符。示例采用其他标识符，不构成类型或写法冲突。

component_types:

| 成分 | 固定类型 | 手册示例标识符 | 单位 | 说明 |
|---|---|---|---|---|
| 工具负载质量 | double | m | g | 质量 |
| 工具负载质心位置 | Centroid_Pos | centroidpos、centroid_pos |  | 质心位置 |
| 工具负载惯性参数 | Inertia_Tensor | inertiatensor、Inertia_Tensor |  | 惯性参数 |



---

## palletcompenpara
desc: 托盘（垛盘）数据结构体类型

desc_en: Pallet data structure type

type: datatype

syntax: type

signature: palletcompenpara

kind: struct

manual_ref: ARL V4.5.0：§2.4.15（manual p.28）

examples:

```arl
palletcompenpara pallet1
pallet1.p1 = $P[0]
pallet1.p2 = $P[1]
pallet1.p3 = $P[2]
pallet1.p4 = $P[3]
pallet1.length = 100
pallet1.width = 100
```

members:

| 成员 | 类型 | 单位 | 说明 | desc_en |
|---|---|---|---|---|
| p1 | pose |  | 垛盘原点 | pallet origin |
| p2 | pose |  | 垛盘 X 正方向一点 | point on +X |
| p3 | pose |  | 垛盘 Y 正方向一点 | point on +Y |
| p4 | pose |  | 垛盘原点的对角点 | diagonal point |
| length | double | mm | 垛盘长度（X 方向） | pallet length |
| width | double | mm | 垛盘宽度（Y 方向） | pallet width |

notes:

- 手册要求 p1、p2、p3、p4 构成精确矩形。


---

## control
desc: 门型动作控制参数结构体类型（SCARA）

desc_en: Gate-motion control parameter structure type (SCARA)

type: datatype

syntax: type

signature: control

kind: struct

manual_ref: ARL V4.5.0：§2.5.11（manual p.40）

examples:

```arl
control ctr1 = {rising_vel 0,rising_acc 0,rising_dec 0,falling_vel 0,falling_acc 0,falling_dec 100}
```

members:

| 成员 | 类型 | 单位 | 说明 | desc_en |
|---|---|---|---|---|
| rising_vel | double | % | 直升阶段最大速度百分比 | rising max speed percent |
| rising_acc | double | % | 直升阶段最大加速度百分比 | rising max acceleration percent |
| rising_dec | double | % | 直升阶段最大减速度百分比 | rising max deceleration percent |
| falling_vel | double | % | 直降阶段最大速度百分比 | falling max speed percent |
| falling_acc | double | % | 直降阶段最大加速度百分比 | falling max acceleration percent |
| falling_dec | double | % | 直降阶段最大减速度百分比 | falling max deceleration percent |


---

## printto
desc: print 输出定向枚举类型

desc_en: Print destination enum

type: datatype

syntax: type

signature: printto

kind: enum

manual_ref: ARL V4.5.0：§2.6.2（manual p.42）

examples:

```arl
print to:hmi,"hello world"
```

enum_members:

| 枚举值 | 说明 |
|---|---|
| off | 关闭输出 |
| hmi | 输出到 HMI 消息栏 |
| file | 输出到文件 |
| console | 输出到终端 |


---

## num_base
desc: print 输出数制枚举类型

desc_en: Print number-base enum

type: datatype

syntax: type

signature: num_base

kind: enum

manual_ref: ARL V4.5.0：§2.6.3（manual p.43）

examples:

```arl
print hex,ffh
print dec,ffh
```

enum_members:

| 枚举值 | 说明 |
|---|---|
| hex | 16 进制 |
| dec | 10 进制 |


---

## stoptype
desc: 运动停止类型枚举

desc_en: Motion stop-type enum

type: datatype

syntax: type

signature: stoptype

kind: enum

manual_ref: ARL V4.5.0：§2.6.4（manual p.44）

examples:

```arl
stopmove fast
```

enum_members:

| 枚举值 | 说明 |
|---|---|
| general | 普通减速停止 |
| fast | 快速减速停止 |


---

## controlmode
desc: 系统控制模式枚举

desc_en: System control-mode enum

type: datatype

syntax: type

signature: controlmode

kind: enum

manual_ref: ARL V4.5.0：§2.6.5（manual p.44）

enum_members:

| 枚举值 | 说明 |
|---|---|
| MANUAL | 手动低速模式 |
| AUTO | 自动模式 |
| MANUFAST | 手动高速模式 |

---

## stopbits
desc: 串口停止位枚举

desc_en: Serial stop-bits enum

type: datatype

syntax: type

signature: stopbits

kind: enum

manual_ref: ARL V4.5.0：§2.6.6（manual p.45）

enum_members:

| 枚举值 | 说明 |
|---|---|
| one | 1 位停止位 |
| two | 2 位停止位 |

---

## parity
desc: 串口奇偶校验枚举

desc_en: Serial parity enum

type: datatype

syntax: type

signature: parity

kind: enum

manual_ref: ARL V4.5.0：§2.6.7（manual p.45）

enum_members:

| 枚举值 | 说明 |
|---|---|
| none | 无奇偶校验 |
| odd | 奇校验 |
| even | 偶校验 |

---

## weaveshape
desc: 叠加轨迹图形类型枚举

desc_en: Weave-shape enum

type: datatype

syntax: type

signature: weaveshape

kind: enum

manual_ref: ARL V4.5.0：§2.6.8（manual p.46）

examples:

```arl
weavedata w1 = {weave_type V_shape, frequency 2, amplitude 5, swing_angle 90}
```

enum_members:

| 枚举值 | 说明 |
|---|---|
| simple | 横摆 |
| V_shape | V 型摆 |
| triangle | 空间三角摆 |
| ellipse | 椭圆摆 |
| eight | 8 字摆 |


notes:

- weavedata 的 weave_type 成员使用此枚举；可写枚举名或整数（simple 为 0）。
- 手册 §2.6.8 示例 `{V_shape,2,15,90}` 按位置对应时 90 落在 amplitude_left，已改为写成员名（用户确认手册按位置写的摆动示例有误）。

---

## weaverotaxis
desc: 叠加轨迹摆动平面偏转轴枚举

desc_en: Weave rotation-axis enum

type: datatype

syntax: type

signature: weaverotaxis

kind: enum

manual_ref: ARL V4.5.0：§2.6.9（manual p.47）

examples:

```arl
weavedata w1 = {weave_type V_shape, frequency 2, amplitude 5, swing_angle 90, axis rot_x, rotation_angle 10}
```

enum_members:

| 枚举值 | 说明 |
|---|---|
| rot_x | 参考 x 轴偏转 |
| rot_y | 参考 y 轴偏转 |
| rot_z | 参考 z 轴偏转 |


notes:

- weavedata 的 axis 成员使用此枚举；可写枚举名或整数（rot_x 为 0）。
- 手册 §2.6.9 示例 `{V_shape,2,15,90,rot_x,10}` 按位置对应时 rot_x 落在 amplitude_right，已改为写成员名（用户确认手册按位置写的摆动示例有误）。

---

## clock
desc: 时钟计时器类型

desc_en: Clock timer type

type: datatype

syntax: type

signature: clock

manual_ref: ARL V4.5.0：§5.3.1（manual p.127）


examples:

```arl
clock c
clkstart(c)
waittime 3
clkstop(c)
```

---

## iodev
desc: IO设备类型

desc_en: IO device type

type: datatype

syntax: type

signature: iodev

manual_ref: ARL V4.5.0：§2.7.2（manual p.47）


examples:

```arl
iodev s
open(s,"/dev/ttyS0",9600,8,one,none)
```

---

## socket
desc: 套接字类型

desc_en: TCP Socket type

type: datatype

syntax: type

signature: socket

manual_ref: ARL V4.5.0：§2.7.1（manual p.47）；§5.6.1（manual p.143）


examples:

```arl
socket s
waituntil connect(s,"192.168.0.40",2888)
```

---

## melsec_dev
desc: 三菱PLC通信设备类型

desc_en: Mitsubishi PLC communication device type

type: datatype

syntax: type

signature: melsec_dev

manual_ref: ARL V4.5.0：§5.6.5（manual p.158）


examples:

```arl
melsec_dev mc
waituntil open(mc,"10.20.220.92",8080,255)
```

---

## modbus_dev
desc: Modbus通信设备类型

desc_en: Modbus communication device type

type: datatype

syntax: type

signature: modbus_dev

manual_ref: ARL V4.5.0：§5.6.6（manual p.161）


examples:

```arl
modbus_dev m
open(m,"rtserMB0",1,115200,8,1,none)
```

---

## modbus_rtu_master
desc: Modbus RTU 主站设备类型

desc_en: Modbus RTU master device type

type: datatype

syntax: type

signature: modbus_rtu_master

manual_ref: ARL V4.5.0：§5.6.7（manual p.165）


examples:

```arl
modbus_rtu_master m
open(m,"/dev/ttyS0",1,115200,8,1,none)
```

---

## tcpforce
desc: TCP六维力矢量类型

desc_en: TCP 6-axis force vector type

type: datatype

syntax: type

signature: tcpforce

kind: struct

manual_ref: ARL V4.5.0：§5.8.16（manual p.187）

members:

| 成员 | 类型 | 单位 | 说明 | desc_en |
|---|---|---|---|---|
| fx | double | N | TCP 输出力在当前工件坐标系的 x 分量 | force x |
| fy | double | N | TCP 输出力在当前工件坐标系的 y 分量 | force y |
| fz | double | N | TCP 输出力在当前工件坐标系的 z 分量 | force z |
| tx | double | N·m | 工具输出力矩在当前工件坐标系的 x 分量 | torque x |
| ty | double | N·m | 工具输出力矩在当前工件坐标系的 y 分量 | torque y |
| tz | double | N·m | 工具输出力矩在当前工件坐标系的 z 分量 | torque z |

---

## jttq
desc: 关节力矩数据类型

desc_en: Joint torque data type

type: datatype

syntax: type

signature: jttq

kind: struct

manual_ref: ARL V4.5.0：§5.8.8（manual p.180）

verification: confirmed-user-correction

members:

| 成员 | 类型 | 单位 | 说明 | desc_en |
|---|---|---|---|---|
| jt1 | double | N·m | 机器人 1 轴输出力矩 | joint 1 torque |
| jt2 | double | N·m | 机器人 2 轴输出力矩 | joint 2 torque |
| jt3 | double | N·m | 机器人 3 轴输出力矩 | joint 3 torque |
| jt4 | double | N·m | 机器人 4 轴输出力矩 | joint 4 torque |
| jt5 | double | N·m | 机器人 5 轴输出力矩 | joint 5 torque |
| jt6 | double | N·m | 机器人 6 轴输出力矩 | joint 6 torque |
| et1 | double | N·m | 外轴 1 输出力矩 | ext axis 1 torque |
| et2 | double | N·m | 外轴 2 输出力矩 | ext axis 2 torque |
| et3 | double | N·m | 外轴 3 输出力矩 | ext axis 3 torque |
| et4 | double | N·m | 外轴 4 输出力矩 | ext axis 4 torque |
| et5 | double | N·m | 外轴 5 输出力矩 | ext axis 5 torque |
| et6 | double | N·m | 外轴 6 输出力矩 | ext axis 6 torque |

notes:

- 成员名以手册结构体定义的 jt1~jt6 为准；手册成员表写 j1~j6 有误（用户确认）。

---

## jtci
desc: 关节电流数据类型

desc_en: Joint current data type

type: datatype

syntax: type

signature: jtci

kind: struct

manual_ref: ARL V4.5.0：§5.8.9（manual p.181）

members:

| 成员 | 类型 | 单位 | 说明 | desc_en |
|---|---|---|---|---|
| ji1 | double | A | 机器人 1 轴电机电流 Iq | joint 1 current |
| ji2 | double | A | 机器人 2 轴电机电流 Iq | joint 2 current |
| ji3 | double | A | 机器人 3 轴电机电流 Iq | joint 3 current |
| ji4 | double | A | 机器人 4 轴电机电流 Iq | joint 4 current |
| ji5 | double | A | 机器人 5 轴电机电流 Iq | joint 5 current |
| ji6 | double | A | 机器人 6 轴电机电流 Iq | joint 6 current |
| ei1 | double | A | 外轴 1 电机电流 Iq | ext axis 1 current |
| ei2 | double | A | 外轴 2 电机电流 Iq | ext axis 2 current |
| ei3 | double | A | 外轴 3 电机电流 Iq | ext axis 3 current |
| ei4 | double | A | 外轴 4 电机电流 Iq | ext axis 4 current |
| ei5 | double | A | 外轴 5 电机电流 Iq | ext axis 5 current |
| ei6 | double | A | 外轴 6 电机电流 Iq | ext axis 6 current |

---

## compendata
desc: 补偿数据类型

desc_en: Compensation data type

type: datatype

syntax: type

signature: compendata

kind: struct

manual_ref: ARL V4.5.0：§3.2.11.2 用法举例（manual p.76）

verification: confirmed-user-correction


examples:

```arl
const compendata data1 = {tcp_max_vel 250,tcp_max_acc 900,tcp_max_jerk 6000,ori_max_vel 50,ori_max_acc 75,ori_max_jerk 375}
```

members:

| 成员 | 类型 | 单位 | 说明 | desc_en |
|---|---|---|---|---|
| tcp_max_vel | double | mm/s | 轨迹补偿时 TCP 最大速度，取值 0~2500 | TCP max velocity |
| tcp_max_acc | double | mm/s² | 轨迹补偿时 TCP 最大加速度，取值 0~20000 | TCP max acceleration |
| tcp_max_jerk | double | mm/s³ | 轨迹补偿时 TCP 最大加加速度，取值 0~200000 | TCP max jerk |
| ori_max_vel | double | °/s | 轨迹补偿时姿态最大角速度，取值 0~2600 | orientation max velocity |
| ori_max_acc | double | °/s² | 轨迹补偿时姿态最大角加速度，取值 0~12187.4 | orientation max acceleration |
| ori_max_jerk | double | °/s³ | 轨迹补偿时姿态最大角加加速度，取值 0~300000 | orientation max jerk |

notes:

- 成员名已由用户按控制器程序确认，标准写法如 `const compendata data1 = { tcp_max_vel 250 , tcp_max_acc 2000 , tcp_max_jerk 20000 , ori_max_vel 260 , ori_max_acc 1218.74 , ori_max_jerk 30000 }`。
- 只用于 startcompen 的 data；外轴补偿的 dataj 是另一类型 compendatajoint。
- 取值范围取自控制器界面（用户提供截图）；手册未给单位，按 mm、s、° 组合标注（用户说明）。编程中一般不需要手写。

---

## compendatajoint
desc: 外轴轨迹补偿动态参数结构体类型

desc_en: External-axis compensation dynamics structure type

type: datatype

syntax: type

signature: compendatajoint

kind: struct

manual_ref: Manually Added（手册 §3.2.11.1 startcompen 把 dataj 的类型写作 compendata；实际类型由用户按控制器生成的程序确认）

verification: confirmed-user-correction

examples:

```arl
const compendatajoint dataj1 = { ej1 { max_vel 250 , max_acc 2000 , max_jerk 20000 } , ej2 { max_vel 250 , max_acc 2000 , max_jerk 20000 } , ej3 { max_vel 250 , max_acc 2000 , max_jerk 20000 } , ej4 { max_vel 250 , max_acc 2000 , max_jerk 20000 } , ej5 { max_vel 250 , max_acc 2000 , max_jerk 20000 } , ej6 { max_vel 250 , max_acc 2000 , max_jerk 20000 } }
```

members:

| 成员 | 类型 | 单位 | 说明 | desc_en |
|---|---|---|---|---|
| ej1 | struct |  | 外轴 1 的补偿动态上限；子成员 max_vel、max_acc、max_jerk，均为 double | ext axis 1 limits |
| ej2 | struct |  | 外轴 2 的补偿动态上限；子成员 max_vel、max_acc、max_jerk，均为 double | ext axis 2 limits |
| ej3 | struct |  | 外轴 3 的补偿动态上限；子成员 max_vel、max_acc、max_jerk，均为 double | ext axis 3 limits |
| ej4 | struct |  | 外轴 4 的补偿动态上限；子成员 max_vel、max_acc、max_jerk，均为 double | ext axis 4 limits |
| ej5 | struct |  | 外轴 5 的补偿动态上限；子成员 max_vel、max_acc、max_jerk，均为 double | ext axis 5 limits |
| ej6 | struct |  | 外轴 6 的补偿动态上限；子成员 max_vel、max_acc、max_jerk，均为 double | ext axis 6 limits |

notes:

- 每个 ejN 是含 max_vel（最大速度）、max_acc（最大加速度）、max_jerk（最大加加速度）的子结构体，三个子成员都是 double（用户确认），按 `ej1 { max_vel 250 , max_acc 2000 , max_jerk 20000 }` 的形式赋值。
- 子成员取值范围取自控制器界面（用户提供截图）：max_vel 0~2500，max_acc 0~20000，max_jerk 0~200000；单位直线外轴为 mm/s、mm/s²、mm/s³，旋转外轴为 °/s、°/s²、°/s³。
- 子结构体的类型名未知，不影响编程（按示例写法赋值）。编程中一般不需要手写。

---

## void
desc: 表示函数无返回值的类型关键字

desc_en: Void return type keyword

type: datatype

syntax: type

signature: void

manual_ref: ARL V4.5.0：ARL 概述 / 函数（manual p.2）

---

# ═══ 内置常量 (Built-in Constants) ═══

## true
desc: 布尔量：真

desc_en: Boolean literal: true

type: builtin.constant

syntax: constant

signature: true

manual_ref: ARL V4.5.0：§2.3.5 bool（manual p.9）

---

## false
desc: 布尔量：假

desc_en: Boolean literal: false

type: builtin.constant

syntax: constant

signature: false

manual_ref: ARL V4.5.0：§2.3.5 bool（manual p.9）

---

## endl
desc: 换行符常量，用于 print 输出换行

desc_en: Newline constant for print

type: builtin.constant

syntax: constant

signature: endl

manual_ref: ARL V4.5.0：§3.5.1 print（manual p.91）

---

## PI
desc: 圆周率常量，与 $PI 等效

desc_en: Pi constant, equivalent to $PI

type: builtin.constant

syntax: constant

signature: PI

manual_ref: ARL V4.5.0：§5.1.2~§5.1.4 示例（manual p.107）；与 $PI 等效由用户确认

verification: confirmed-user-correction

---

# ═══ 系统变量 (System Variables) ═══

## $I
desc: 整数型系统变量数组（$I[index]）

desc_en: Integer system variable array

type: sysvar

syntax: sysvar

signature: $I

value_type: int

shape: array

array_length: 1000

manual_ref: ARL V4.5.0：§10.1.1（manual p.239）

verification: confirmed-user-correction

---

## $I_NAME
desc: 整数型系统变量名称数组，与 $I 的元素一一对应

desc_en: Integer system variable name array

type: sysvar

syntax: sysvar

signature: $I_NAME

value_type: string

shape: array

array_length: 1000

manual_ref: ARL V4.5.0：§10.1.2（manual p.239）

verification: confirmed-user-correction

---

## $S
desc: 字符串型系统变量数组（$S[index]）

desc_en: String system variable array

type: sysvar

syntax: sysvar

signature: $S

value_type: string

shape: array

array_length: 1000

manual_ref: ARL V4.5.0 手册将该名称误写为 `$STRING`；实际 ARL 使用 `$S`

verification: confirmed-user-correction

notes:

- 用户已确认：`$S` 是官方手册中 `$STRING` 的实际替代名称。
- 本语言元数据以实际 ARL 名称 `$S` 为准，不再保留 `$STRING` 为有效词条。

---

## $S_NAME
desc: 字符串型系统变量名称数组，与 $S 的元素一一对应

desc_en: String system variable name array

type: sysvar

syntax: sysvar

signature: $S_NAME

value_type: string

shape: array

array_length: 1000

manual_ref: ARL V4.5.0 未找到 `$STRING_NAME` 或 `$S_NAME` 的独立条目；`$S_NAME` 由用户按实际 ARL 确认

verification: confirmed-user-correction

notes:

- 用户已确认实际 ARL 使用 `$S_NAME`；手册没有可核对的独立条目，数组长度为 1000，与 `$S` 的元素一一对应。

---

## $B
desc: 布尔型系统变量数组（$B[index]）

desc_en: Boolean system variable array

type: sysvar

syntax: sysvar

signature: $B

value_type: bool

shape: array

array_length: 1000

manual_ref: ARL V4.5.0：§10.1.4（manual p.240）

verification: confirmed-user-correction

---

## $B_NAME
desc: 布尔型系统变量名称数组，与 $B 的元素一一对应

desc_en: Boolean system variable name array

type: sysvar

syntax: sysvar

signature: $B_NAME

value_type: string

shape: array

array_length: 1000

manual_ref: ARL V4.5.0：§10.1.5（manual p.240）

verification: confirmed-user-correction

---

## $D
desc: 浮点型系统变量数组（$D[index]）

desc_en: Double system variable array

type: sysvar

syntax: sysvar

signature: $D

value_type: double

shape: array

array_length: 1000

manual_ref: ARL V4.5.0：§10.1.6（manual p.241）

verification: confirmed-user-correction

---

## $D_NAME
desc: 浮点型系统变量名称数组，与 $D 的元素一一对应

desc_en: Double system variable name array

type: sysvar

syntax: sysvar

signature: $D_NAME

value_type: string

shape: array

array_length: 1000

manual_ref: ARL V4.5.0：§10.1.7（manual p.241）

verification: confirmed-user-correction

---

## $P
desc: 位姿型系统变量数组（$P[index]）

desc_en: Pose system variable array

type: sysvar

syntax: sysvar

signature: $P

value_type: pose

shape: array

array_length: 1000

manual_ref: ARL V4.5.0：§10.1.8（manual p.241）

verification: confirmed-user-correction

---

## $P_NAME
desc: 位姿型系统变量名称数组，与 $P 的元素按相同索引一一对应

desc_en: Pose system variable name array corresponding to $P

type: sysvar

syntax: sysvar

signature: $P_NAME

value_type: string

shape: array

array_length: 1000

manual_ref: ARL V4.5.0 未单列 `$P_NAME`；名称、长度及索引关系由用户按实际控制器确认

verification: confirmed-user-correction

---

## $PV1
desc: 位姿型系统变量数组（$PV1[index]），对应 HMI 位姿系统变量的第 1 组扩展区

desc_en: Extended pose system variable array $PV1

type: sysvar

syntax: sysvar

signature: $PV1

value_type: pose

shape: array

array_length: 1000

manual_ref: ARL V4.5.0：§10.1.8，pose 类型系统变量与 HMI 映射表；实际长度经用户确认

verification: confirmed-user-correction

---

## $PV1_NAME
desc: 位姿型系统变量名称数组，与 $PV1 的元素按相同索引一一对应

desc_en: Pose system variable name array corresponding to $PV1

type: sysvar

syntax: sysvar

signature: $PV1_NAME

value_type: string

shape: array

array_length: 1000

manual_ref: ARL V4.5.0 未单列 `$PV1_NAME`；名称、长度及索引关系由用户按实际控制器确认

verification: confirmed-user-correction

---

## $PV2
desc: 位姿型系统变量数组（$PV2[index]），对应 HMI 位姿系统变量的第 2 组扩展区

desc_en: Extended pose system variable array $PV2

type: sysvar

syntax: sysvar

signature: $PV2

value_type: pose

shape: array

array_length: 1000

manual_ref: ARL V4.5.0：§10.1.8，pose 类型系统变量与 HMI 映射表；实际长度经用户确认

verification: confirmed-user-correction

---

## $PV2_NAME
desc: 位姿型系统变量名称数组，与 $PV2 的元素按相同索引一一对应

desc_en: Pose system variable name array corresponding to $PV2

type: sysvar

syntax: sysvar

signature: $PV2_NAME

value_type: string

shape: array

array_length: 1000

manual_ref: ARL V4.5.0 未单列 `$PV2_NAME`；名称、长度及索引关系由用户按实际控制器确认

verification: confirmed-user-correction

---

## $PV3
desc: 位姿型系统变量数组（$PV3[index]），对应 HMI 位姿系统变量的第 3 组扩展区

desc_en: Extended pose system variable array $PV3

type: sysvar

syntax: sysvar

signature: $PV3

value_type: pose

shape: array

array_length: 1000

manual_ref: ARL V4.5.0：§10.1.8，pose 类型系统变量与 HMI 映射表；实际长度经用户确认

verification: confirmed-user-correction

---

## $PV3_NAME
desc: 位姿型系统变量名称数组，与 $PV3 的元素按相同索引一一对应

desc_en: Pose system variable name array corresponding to $PV3

type: sysvar

syntax: sysvar

signature: $PV3_NAME

value_type: string

shape: array

array_length: 1000

manual_ref: ARL V4.5.0 未单列 `$PV3_NAME`；名称、长度及索引关系由用户按实际控制器确认

verification: confirmed-user-correction

---

## $PV4
desc: 位姿型系统变量数组（$PV4[index]），对应 HMI 位姿系统变量的第 4 组扩展区

desc_en: Extended pose system variable array $PV4

type: sysvar

syntax: sysvar

signature: $PV4

value_type: pose

shape: array

array_length: 1000

manual_ref: ARL V4.5.0：§10.1.8，pose 类型系统变量与 HMI 映射表；实际长度经用户确认

verification: confirmed-user-correction

---

## $PV4_NAME
desc: 位姿型系统变量名称数组，与 $PV4 的元素按相同索引一一对应

desc_en: Pose system variable name array corresponding to $PV4

type: sysvar

syntax: sysvar

signature: $PV4_NAME

value_type: string

shape: array

array_length: 1000

manual_ref: ARL V4.5.0 未单列 `$PV4_NAME`；名称、长度及索引关系由用户按实际控制器确认

verification: confirmed-user-correction

---

## $PV5
desc: 位姿型系统变量数组（$PV5[index]），对应 HMI 位姿系统变量的第 5 组扩展区

desc_en: Extended pose system variable array $PV5

type: sysvar

syntax: sysvar

signature: $PV5

value_type: pose

shape: array

array_length: 1000

manual_ref: ARL V4.5.0：§10.1.8，pose 类型系统变量与 HMI 映射表；实际长度经用户确认

verification: confirmed-user-correction

---

## $PV5_NAME
desc: 位姿型系统变量名称数组，与 $PV5 的元素按相同索引一一对应

desc_en: Pose system variable name array corresponding to $PV5

type: sysvar

syntax: sysvar

signature: $PV5_NAME

value_type: string

shape: array

array_length: 1000

manual_ref: ARL V4.5.0 未单列 `$PV5_NAME`；名称、长度及索引关系由用户按实际控制器确认

verification: confirmed-user-correction

---

## $PV6
desc: 位姿型系统变量数组（$PV6[index]），对应 HMI 位姿系统变量的第 6 组扩展区

desc_en: Extended pose system variable array $PV6

type: sysvar

syntax: sysvar

signature: $PV6

value_type: pose

shape: array

array_length: 1000

manual_ref: ARL V4.5.0：§10.1.8，pose 类型系统变量与 HMI 映射表；实际长度经用户确认

verification: confirmed-user-correction

---

## $PV6_NAME
desc: 位姿型系统变量名称数组，与 $PV6 的元素按相同索引一一对应

desc_en: Pose system variable name array corresponding to $PV6

type: sysvar

syntax: sysvar

signature: $PV6_NAME

value_type: string

shape: array

array_length: 1000

manual_ref: ARL V4.5.0 未单列 `$PV6_NAME`；名称、长度及索引关系由用户按实际控制器确认

verification: confirmed-user-correction

---

## $PV7
desc: 位姿型系统变量数组（$PV7[index]），对应 HMI 位姿系统变量的第 7 组扩展区

desc_en: Extended pose system variable array $PV7

type: sysvar

syntax: sysvar

signature: $PV7

value_type: pose

shape: array

array_length: 1000

manual_ref: ARL V4.5.0：§10.1.8，pose 类型系统变量与 HMI 映射表；实际长度经用户确认

verification: confirmed-user-correction

---

## $PV7_NAME
desc: 位姿型系统变量名称数组，与 $PV7 的元素按相同索引一一对应

desc_en: Pose system variable name array corresponding to $PV7

type: sysvar

syntax: sysvar

signature: $PV7_NAME

value_type: string

shape: array

array_length: 1000

manual_ref: ARL V4.5.0 未单列 `$PV7_NAME`；名称、长度及索引关系由用户按实际控制器确认

verification: confirmed-user-correction

---

## $PV8
desc: 位姿型系统变量数组（$PV8[index]），对应 HMI 位姿系统变量的第 8 组扩展区

desc_en: Extended pose system variable array $PV8

type: sysvar

syntax: sysvar

signature: $PV8

value_type: pose

shape: array

array_length: 1000

manual_ref: ARL V4.5.0：§10.1.8，pose 类型系统变量与 HMI 映射表；实际长度经用户确认

verification: confirmed-user-correction

---

## $PV8_NAME
desc: 位姿型系统变量名称数组，与 $PV8 的元素按相同索引一一对应

desc_en: Pose system variable name array corresponding to $PV8

type: sysvar

syntax: sysvar

signature: $PV8_NAME

value_type: string

shape: array

array_length: 1000

manual_ref: ARL V4.5.0 未单列 `$PV8_NAME`；名称、长度及索引关系由用户按实际控制器确认

verification: confirmed-user-correction

---

## $PV9
desc: 位姿型系统变量数组（$PV9[index]），对应 HMI 位姿系统变量的第 9 组扩展区

desc_en: Extended pose system variable array $PV9

type: sysvar

syntax: sysvar

signature: $PV9

value_type: pose

shape: array

array_length: 1000

manual_ref: ARL V4.5.0：§10.1.8，pose 类型系统变量与 HMI 映射表；实际长度经用户确认

verification: confirmed-user-correction

---

## $PV9_NAME
desc: 位姿型系统变量名称数组，与 $PV9 的元素按相同索引一一对应

desc_en: Pose system variable name array corresponding to $PV9

type: sysvar

syntax: sysvar

signature: $PV9_NAME

value_type: string

shape: array

array_length: 1000

manual_ref: ARL V4.5.0 未单列 `$PV9_NAME`；名称、长度及索引关系由用户按实际控制器确认

verification: confirmed-user-correction

---

## $J
desc: 关节型系统变量数组（$J[index]）

desc_en: Joint system variable array

type: sysvar

syntax: sysvar

signature: $J

value_type: joint

shape: array

array_length: 1000

manual_ref: ARL V4.5.0：§10.1.9（manual p.242）

verification: confirmed-user-correction

---

## $J_NAME
desc: 关节型系统变量名称数组，与 $J 的元素一一对应

desc_en: Joint system variable name array corresponding to $J

type: sysvar

syntax: sysvar

signature: $J_NAME

value_type: string

shape: array

array_length: 1000

manual_ref: ARL V4.5.0 未找到 `$J_NAME` 的独立条目；名称及长度由用户按实际控制器确认

verification: confirmed-user-correction

---

## $TOOLS
desc: 工具坐标系数组

desc_en: Tool frame array

type: sysvar

syntax: sysvar

signature: $TOOLS

value_type: tool

shape: array

array_length: 32

manual_ref: ARL V4.5.0：§10.1.10（manual p.242）

---

## $TOOLS_NAME
desc: 工具坐标系名称数组

desc_en: Tool frame name array

type: sysvar

syntax: sysvar

signature: $TOOLS_NAME

value_type: string

shape: array

array_length: 32

manual_ref: ARL V4.5.0：§10.1.11（manual p.243）

verification: confirmed-user-correction

notes:

- 手册表格将数据类型写为 `tool结构体数组[32]`；用户确认实际元素类型是 `string`。保留手册给出的数组长度 32。
- 默认名称为 tool0、tool1、tool2…；`$tool0`、`$tool1` 等可直接引用对应工具（用户确认）。ARL 不区分大小写，`$TOOL0` 与 `$tool0` 相同。

---

## $WOBJS
desc: 工件坐标系数组

desc_en: Work object frame array

type: sysvar

syntax: sysvar

signature: $WOBJS

value_type: wobj

shape: array

array_length: 32

manual_ref: ARL V4.5.0：§10.1.12（manual p.243）

---

## $WOBJS_NAME
desc: 工件坐标系名称数组

desc_en: Work object frame name array

type: sysvar

syntax: sysvar

signature: $WOBJS_NAME

value_type: string

shape: array

array_length: 32

manual_ref: ARL V4.5.0：§10.1.13（manual p.244）

verification: confirmed-user-correction

notes:

- 手册表格将数据类型写为 `wobj结构体数组[32]`；用户确认实际元素类型是 `string`。保留手册给出的数组长度 32。
- 默认名称为 wobj0、wobj1…；`$wobj0` 等可直接引用对应工件坐标系（用户确认）。

---

## $BASE
desc: 基座坐标系数组（$BASE[0]～$BASE[2]）

desc_en: Base coordinate frame array

type: sysvar

syntax: sysvar

signature: $BASE

value_type: wobj

shape: array

array_length: 3

manual_ref: ARL V4.5.0：§10.1.14（manual p.244），表题 `$BASE[]`、索引 0～2；数组形态由用户确认

verification: confirmed-user-correction

---

## $FLANGE
desc: 法兰坐标系

desc_en: Flange coordinate frame

type: sysvar

syntax: sysvar

signature: $FLANGE

value_type: tool

is_constant: true

manual_ref: ARL V4.5.0：§10.1.15（manual p.244）

---

## $WORLD
desc: 世界坐标系

desc_en: World coordinate frame

type: sysvar

syntax: sysvar

signature: $WORLD

value_type: wobj

is_constant: true

manual_ref: ARL V4.5.0：§10.1.16（manual p.245）

---

## $Config_check
desc: 轴配置检查使能

desc_en: Axis configuration check enable

type: sysvar

syntax: sysvar

signature: $Config_check

value_type: bool

manual_ref: ARL V4.5.0：§10.2.1（manual p.245）

---

## $CCIR_ERROR_THRESHOLD
desc: ccir示教点不均匀报警阈值

desc_en: Alarm threshold for uneven ccir teaching points

type: sysvar

syntax: sysvar

signature: $CCIR_ERROR_THRESHOLD

value_type: double

range: 0~0.5

manual_ref: ARL V4.5.0：§10.2.2（manual p.245）

notes:

- 默认 0.1，断电重启后恢复。ccir 用 2 个示教点确定圆弧时，两段弧长与总弧长之比都不能小于该值，否则报警。

---

## $DFSPEED
desc: 默认速度参数

desc_en: Default speed parameter

type: sysvar

syntax: sysvar

signature: $DFSPEED

value_type: speed

manual_ref: ARL V4.5.0：§10.2.3（manual p.246）

---

## $DFSLIP
desc: 默认平滑参数

desc_en: Default blending parameter

type: sysvar

syntax: sysvar

signature: $DFSLIP

value_type: slip

manual_ref: ARL V4.5.0：§10.2.4（manual p.246）

---

## $DFTOOL
desc: 默认工具参数

desc_en: Default tool parameter

type: sysvar

syntax: sysvar

signature: $DFTOOL

value_type: tool

manual_ref: ARL V4.5.0：§10.2.5（manual p.247）

---

## $DFWOBJ
desc: 默认工件坐标系参数

desc_en: Default work object frame parameter

type: sysvar

syntax: sysvar

signature: $DFWOBJ

value_type: wobj

manual_ref: ARL V4.5.0：§10.2.6（manual p.247）

---

## $IGNORE_ORI
desc: 方向忽略使能

desc_en: Orientation ignore enable

type: sysvar

syntax: sysvar

signature: $IGNORE_ORI

value_type: bool

manual_ref: ARL V4.5.0：§10.2.7（manual p.247）

---

## $ORI_REF_PATH
desc: 圆弧方向参照路径坐标系

desc_en: Reference path coordinate system for arc orientation

type: sysvar

syntax: sysvar

signature: $ORI_REF_PATH

value_type: bool

manual_ref: ARL V4.5.0：§10.2.8（manual p.248）

---

## $VEL_PROFILE
desc: 速度轮廓类型

desc_en: Velocity profile type

type: sysvar

syntax: sysvar

signature: $VEL_PROFILE

value_type: enum

manual_ref: ARL V4.5.0：§2.6.1（manual p.42）；§10.2.9（manual p.248）

examples:

```arl
$VEL_PROFILE = S_type
movej j:j1,vp:5%,sp:-1%
```

enum_members:

| 枚举值 | 说明 |
|---|---|
| T_type | T 型速度曲线 |
| S_type | S 型速度曲线 |
| O_type | O 型速度曲线 |

---

## $TRAJ_ELAPSE_TIME
desc: 轨迹经过时间

desc_en: Elapsed trajectory time

type: sysvar

syntax: sysvar

signature: $TRAJ_ELAPSE_TIME

value_type: double

manual_ref: ARL V4.5.0：§10.2.10（manual p.248）

---

## $TRAJ_LEFT_TIME
desc: 轨迹剩余时间

desc_en: Remaining trajectory time

type: sysvar

syntax: sysvar

signature: $TRAJ_LEFT_TIME

value_type: double

manual_ref: ARL V4.5.0：§10.2.11（manual p.249）

---

## $TRAJ_ELAPSE_DIS
desc: 轨迹经过路程

desc_en: Elapsed trajectory distance

type: sysvar

syntax: sysvar

signature: $TRAJ_ELAPSE_DIS

value_type: double

manual_ref: ARL V4.5.0：§10.2.12（manual p.249）

---

## $TRAJ_LEFT_DIS
desc: 轨迹剩余路程

desc_en: Remaining trajectory distance

type: sysvar

syntax: sysvar

signature: $TRAJ_LEFT_DIS

value_type: double

manual_ref: ARL V4.5.0：§10.2.13（manual p.249）

---

## $CJOINT
desc: 上一条运动轨迹的目标点轴位置（系统自动赋值，用于增量编程）

desc_en: Joint target of the previous motion (system-assigned; for incremental programming)

type: sysvar

syntax: sysvar

signature: $CJOINT

value_type: joint

manual_ref: ARL V4.5.0：§10.2.14（manual p.250）

notes:

- 手册名称为"当前轴位置点"，但功能描述是：值始终由系统赋为上一条运动轨迹的目标点轴位置，不是实时反馈位置。取机器人当前实际轴位置用 cjoint()。

---

## $RPP_ENABLE
desc: RPP使能

desc_en: RPP enable

type: sysvar

syntax: sysvar

signature: $RPP_ENABLE

value_type: bool

manual_ref: ARL V4.5.0：§10.2.15（manual p.250）

---

## $AT_HOME
desc: 是否处于 HOME位置

desc_en: Whether at HOME position

type: sysvar

syntax: sysvar

signature: $AT_HOME

value_type: bool

shape: array

array_length: 5

manual_ref: ARL V4.5.0：§10.2.16（manual p.251）

---

## $EXT_CTL_ACT
desc: 外部自动控制被激活

desc_en: External automatic control activated

type: sysvar

syntax: sysvar

signature: $EXT_CTL_ACT

value_type: bool

manual_ref: ARL V4.5.0：§10.2.17（manual p.251）

---

## $PGNO_REQ
desc: 请求程序号状态

desc_en: Program number request status

type: sysvar

syntax: sysvar

signature: $PGNO_REQ

value_type: bool

manual_ref: ARL V4.5.0：§10.2.18（manual p.251）

---

## $PGNO_TYPE
desc: 程序号编码格式；0=二进制，1=BCD，2=N选1

desc_en: Program number encoding: binary, BCD, or one-of-N

type: sysvar

syntax: sysvar

signature: $PGNO_TYPE

value_type: int

range: 0,1,2

manual_ref: ARL V4.5.0：§9.1.1（manual p.233，表9-1）

---

## $PGNO_LENGTH
desc: 程序号位数，范围1~16；BCD格式仅允许4、8、12、16

desc_en: Program number bit length; BCD supports 4, 8, 12, or 16

type: sysvar

syntax: sysvar

signature: $PGNO_LENGTH

value_type: int

range: 1~16

manual_ref: ARL V4.5.0：§9.1.1（manual p.233）

---

## $PGNO
desc: 从外部获取的程序号

desc_en: Program number obtained externally

type: sysvar

syntax: sysvar

signature: $PGNO

value_type: int

manual_ref: ARL V4.5.0：§10.2.19（manual p.252）

---

## $PI
desc: 圆周率

desc_en: Pi

type: sysvar

syntax: sysvar

signature: $PI

value_type: double

is_constant: true

verification: confirmed-user-correction

manual_ref: ARL V4.5.0：§10.2.20（manual p.252）

notes:

- 与 `PI` 等效（用户确认）。

---

## $CTL_MODE
desc: 当前控制模式

desc_en: Current control mode

type: sysvar

syntax: sysvar

signature: $CTL_MODE

value_type: controlmode

manual_ref: ARL V4.5.0：§10.2.21（manual p.253）；取值以 §2.6.5 controlmode 枚举为准

verification: confirmed-user-correction

notes:

- 取值为 controlmode 枚举：MANUAL（手动低速）、AUTO（自动）、MANUFAST（手动高速）。手册 §10.2.21 写作 T1/T2/AUT，用户确认有误。

---

## $WOBJ_OFFSET
desc: 工件坐标系偏移

desc_en: Work object offset

type: sysvar

syntax: sysvar

signature: $WOBJ_OFFSET

value_type: double

shape: array

array_length: 6

manual_ref: ARL V4.5.0：§10.2.22（manual p.253）

examples:

```arl
pose p1 = {x 400,y 0,z 800,a 0,b 0,c 0}
$WOBJ_OFFSET = {50,50,50,0,0,0}
lin p:p1,vp:50%,sp:-1%,t:$FLANGE,w:$WORLD
```

---

## $TOOL_OFFSET
desc: 工具坐标系偏移

desc_en: Tool offset

type: sysvar

syntax: sysvar

signature: $TOOL_OFFSET

value_type: double

shape: array

array_length: 6

manual_ref: ARL V4.5.0：§10.2.23（manual p.254）

examples:

```arl
pose p1 = {x 400,y 0,z 800,a 0,b 0,c 0}
$TOOL_OFFSET = {50,0,0,0,0,0}
lin p:p1,vp:50%,sp:-1%,t:$FLANGE,w:$WORLD
```

---

## $RESET_POS_TYPE
desc: 上电时位置复位方式

desc_en: Position reset mode at power-on

type: sysvar

syntax: sysvar

signature: $RESET_POS_TYPE

value_type: string

manual_ref: ARL V4.5.0：§10.2.24（manual p.254）

verification: confirmed-user-correction

notes:

- 取值 feedback（用实际反馈更新指令位置）或 cmd（满足门限时维持指令位置）。
- 不是数组（用户确认）；手册写的 string数组[100] 有误。

---

## $RESET_POS_THESHOLD
desc: 上电时位置复位判断门限

desc_en: Decision threshold for position reset at power-on

type: sysvar

syntax: sysvar

signature: $RESET_POS_THESHOLD

value_type: double

range: 0~0.5

manual_ref: ARL V4.5.0：§10.2.25（manual p.254）

verification: confirmed-user-correction

notes:

- 最大 0.5、最小 0，单位 °；$RESET_POS_TYPE 为 cmd 且各轴指令与反馈偏差小于门限时，上使能恢复下使能前的指令位置。
- 不是数组（用户确认）；手册写的 double数组[100] 有误。

---

## $WEAVE_FRAME_TYPE
desc: 叠加轨迹坐标系类型

desc_en: Superimposed trajectory coordinate system type

type: sysvar

syntax: sysvar

signature: $WEAVE_FRAME_TYPE

value_type: enum

manual_ref: ARL V4.5.0：§10.2.26（manual p.255）

enum_members:

| 枚举值 | 说明 |
|---|---|
| tool_path | 工具-路径坐标系 |
| tool_type | 工具坐标系 |

---

## $DETECT_SOCK_CLOSE
desc: socket 断线重连功能开关；为 true 时 socket 断开不报警停机，改为置错误状态供 geterror 查询

desc_en: Enable socket disconnection detection for reconnection

type: sysvar

syntax: sysvar

signature: $DETECT_SOCK_CLOSE

value_type: bool

manual_ref: ARL V4.5.0：§5.6.1.5 socket 断线重连（manual p.146~147）；§5.6.1.7（manual p.149）；类型由用户确认

verification: confirmed-user-correction

examples:

```arl
$DETECT_SOCK_CLOSE = true
```

---

## $ERR_SOCK_CLOSED
desc: socket 已断线的错误状态常量，值固定为 1；与 geterror(s) 的返回值比较

desc_en: Constant for socket disconnected state (value 1)

type: sysvar

syntax: sysvar

signature: $ERR_SOCK_CLOSED

value_type: double

is_constant: true

manual_ref: ARL V4.5.0：§5.6.1.5 socket 断线重连（manual p.146~147）；§5.6.1.7（manual p.149）；类型与值由用户确认

verification: confirmed-user-correction

examples:

```arl
interrupt 1,when:geterror(s)==$ERR_SOCK_CLOSED,do:handler()
```

notes:

- 值为 1（double）。geterror 返回 int，ARL 中 int 与 double 可以直接比较。
- 手册 §5.6.1.7 read 一节把它写成 `$ERR_SOCK_CLOSE`（少了 D），是笔误。

---

## $EXT_CTL_ACT_DI
desc: 外部自动控制激活信号 DI 端口号

desc_en: DI port number for external automatic control activation signal

type: sysvar

syntax: sysvar

signature: $EXT_CTL_ACT_DI

value_type: int

manual_ref: ARL V4.5.0：§9.1.1 输入端信号配置（manual p.233）

---

## $SERVO_ON_DI
desc: 伺服上电信号 DI 端口号

desc_en: DI port number for servo-on signal

type: sysvar

syntax: sysvar

signature: $SERVO_ON_DI

value_type: int

manual_ref: ARL V4.5.0：§9.1.1 输入端信号配置（manual p.233）

---

## $SERVO_OFF_DI
desc: 伺服断电信号 DI 端口号

desc_en: DI port number for servo-off signal

type: sysvar

syntax: sysvar

signature: $SERVO_OFF_DI

value_type: int

manual_ref: ARL V4.5.0：§9.1.1 输入端信号配置（manual p.233）

---

## $START_PROG_DI
desc: 启动程序信号 DI 端口号

desc_en: DI port number for start-program signal

type: sysvar

syntax: sysvar

signature: $START_PROG_DI

value_type: int

manual_ref: ARL V4.5.0：§9.1.1 输入端信号配置（manual p.233）

---

## $PAUSE_PROG_DI
desc: 暂停程序信号 DI 端口号

desc_en: DI port number for pause-program signal

type: sysvar

syntax: sysvar

signature: $PAUSE_PROG_DI

value_type: int

manual_ref: ARL V4.5.0：§9.1.1 输入端信号配置（manual p.234）

---

## $RESET_PROG_DI
desc: 复位程序信号 DI 端口号

desc_en: DI port number for reset-program signal

type: sysvar

syntax: sysvar

signature: $RESET_PROG_DI

value_type: int

manual_ref: ARL V4.5.0：§9.1.1 输入端信号配置（manual p.234）

---

## $CLEAR_ALARM_DI
desc: 清除报警信号 DI 端口号

desc_en: DI port number for clear-alarm signal

type: sysvar

syntax: sysvar

signature: $CLEAR_ALARM_DI

value_type: int

manual_ref: ARL V4.5.0：§9.1.1 输入端信号配置（manual p.234）

---

## $PGNO_FBIT_DI
desc: 程序号第一位所在的 DI 端口号

desc_en: DI port number of the first program-number bit

type: sysvar

syntax: sysvar

signature: $PGNO_FBIT_DI

value_type: int

manual_ref: ARL V4.5.0：§9.1.1 输入端信号配置（manual p.235）

---

## $PGNO_PARITY_DI
desc: 奇偶校验信号 DI 端口号

desc_en: DI port number for parity signal

type: sysvar

syntax: sysvar

signature: $PGNO_PARITY_DI

value_type: int

manual_ref: ARL V4.5.0：§9.1.1 输入端信号配置（manual p.235）

---

## $PGNO_VALID_DI
desc: 程序号有效信号 DI 端口号

desc_en: DI port number for program-number valid signal

type: sysvar

syntax: sysvar

signature: $PGNO_VALID_DI

value_type: int

manual_ref: ARL V4.5.0：§9.1.1 输入端信号配置（manual p.235）

---

## $EXT_CTL_CHAN_DI
desc: 外部控制通道选择起始位 DI 端口号

desc_en: DI port number of the start bit for external control channel selection

type: sysvar

syntax: sysvar

signature: $EXT_CTL_CHAN_DI

value_type: int

manual_ref: ARL V4.5.0：§9.1.1 输入端信号配置（manual p.235）

---

## $EXT_CTL_ACT_CONF_DO
desc: 外部自动控制功能激活确认信号 DO 端口号

desc_en: DO port number for external automatic control activation confirmation signal

type: sysvar

syntax: sysvar

signature: $EXT_CTL_ACT_CONF_DO

value_type: int

manual_ref: ARL V4.5.0：§9.1.2 输出端信号配置（manual p.235）

---

## $SERVO_ON_DO
desc: 伺服上电信号 DO 端口号

desc_en: DO port number for servo-on signal

type: sysvar

syntax: sysvar

signature: $SERVO_ON_DO

value_type: int

manual_ref: ARL V4.5.0：§9.1.2 输出端信号配置（manual p.236）

---

## $PGNO_REQ_DO
desc: 请求程序号信号 DO 端口号

desc_en: DO port number for program-number request signal

type: sysvar

syntax: sysvar

signature: $PGNO_REQ_DO

value_type: int

manual_ref: ARL V4.5.0：§9.1.2 输出端信号配置（manual p.236）

---

## $AT_HOME_DO
desc: 处于 HOME 点信号 DO 端口号

desc_en: DO port number for at-HOME signal

type: sysvar

syntax: sysvar

signature: $AT_HOME_DO

value_type: int

shape: array

array_length: 5

manual_ref: ARL V4.5.0：§9.1.2 输出端信号配置（manual p.236）

---

## $AT_T1_DO
desc: 系统处于手动低速模式信号 DO 端口号

desc_en: DO port number for T1 mode signal

type: sysvar

syntax: sysvar

signature: $AT_T1_DO

value_type: int

manual_ref: ARL V4.5.0：§9.1.2 输出端信号配置（manual p.236）

---

## $AT_T2_DO
desc: 系统处于手动高速模式信号 DO 端口号

desc_en: DO port number for T2 mode signal

type: sysvar

syntax: sysvar

signature: $AT_T2_DO

value_type: int

manual_ref: ARL V4.5.0：§9.1.2 输出端信号配置（manual p.236）

---

## $AT_AUT_DO
desc: 系统处于自动模式信号 DO 端口号

desc_en: DO port number for automatic mode signal

type: sysvar

syntax: sysvar

signature: $AT_AUT_DO

value_type: int

manual_ref: ARL V4.5.0：§9.1.2 输出端信号配置（manual p.236）

---

## $PGNO_ACK_FBIT_DO
desc: 程序号确认信号第一位所在的 DO 端口号

desc_en: DO port number of the first bit of the program-number acknowledgment signal

type: sysvar

syntax: sysvar

signature: $PGNO_ACK_FBIT_DO

value_type: int

manual_ref: ARL V4.5.0：§9.1.2 输出端信号配置（manual p.236）

---

## $CHAN_RUN_STATE_DO
desc: 各个通道处于自动程序运行状态 DO 端口号

desc_en: DO port number for automatic program running status of each channel

type: sysvar

syntax: sysvar

signature: $CHAN_RUN_STATE_DO

value_type: int

shape: array

array_length: 12

manual_ref: ARL V4.5.0：§9.1.2 输出端信号配置（manual p.237）

---

## $CHAN_LOAD_STATE_DO
desc: 各个通道程序加载状态 DO 端口号

desc_en: DO port number for program loaded status of each channel

type: sysvar

syntax: sysvar

signature: $CHAN_LOAD_STATE_DO

value_type: int

shape: array

array_length: 12

manual_ref: ARL V4.5.0：§9.1.2 输出端信号配置（manual p.237）

---

## $CHAN_PAUSE_STATE_DO
desc: 各个通道程序暂停状态 DO 端口号

desc_en: DO port number for program paused status of each channel

type: sysvar

syntax: sysvar

signature: $CHAN_PAUSE_STATE_DO

value_type: int

shape: array

array_length: 12

manual_ref: ARL V4.5.0：§9.1.2 输出端信号配置（manual p.237）

---

## $CHAN_STOP_STATE_DO
desc: 各个通道程序停止状态 DO 端口号

desc_en: DO port number for program stopped status of each channel

type: sysvar

syntax: sysvar

signature: $CHAN_STOP_STATE_DO

value_type: int

shape: array

array_length: 12

manual_ref: ARL V4.5.0：§9.1.2 输出端信号配置（manual p.237）

---

## $CHAN_ESTOP_STATE_DO
desc: 各个通道程序急停状态 DO 端口号

desc_en: DO port number for emergency-stop status of each channel

type: sysvar

syntax: sysvar

signature: $CHAN_ESTOP_STATE_DO

value_type: int

manual_ref: ARL V4.5.0：§9.1.2 输出端信号配置，变量类型为 `int`

verification: confirmed-user-correction

notes:

- 手册的 int 标量正确（用户确认），与同组 int[12] 的 `_STATE_DO` 变量不同，不要改成数组。

---

## $CHAN_IDLE_STATE_DO
desc: 前台通道处于空闲状态 DO 端口号

desc_en: DO port number for idle status of the foreground channel

type: sysvar

syntax: sysvar

signature: $CHAN_IDLE_STATE_DO

value_type: int

shape: array

array_length: 6

manual_ref: ARL V4.5.0：§9.1.2 输出端信号配置（manual p.237）

---

## $AT_PATH_DO
desc: 前台通道机器人处于轨迹上时 DO 端口号

desc_en: DO port number when the foreground-channel robot is on path

type: sysvar

syntax: sysvar

signature: $AT_PATH_DO

value_type: int

shape: array

array_length: 12

manual_ref: ARL V4.5.0：§9.1.2 输出端信号配置（manual p.238）

---

# ═══ V2.7 自检摘要 (QA) ═══

> 本节由脚本根据正文统计生成，不要手工修改。

- 条目总数：331
- 重复名称数：0
- 原 Wizard（V1）条目 287 条；V2.5 新增 17 条；V2.6 新增 22 个系统变量（$PGNO_TYPE、$PGNO_LENGTH 及 20 个 $P/$J/$PV 相关数组）；V2.7 新增 5 条：PI 常量、compendatajoint 类型、geterror 函数、$DETECT_SOCK_CLOSE 与 $ERR_SOCK_CLOSED 系统变量。
- 仍为"自动定位"的 manual_ref：0 条

## 各分类数量

| type | 数量 |
|---|---:|
| logic | 20 |
| instruction.motion | 7 |
| instruction | 26 |
| function | 137 |
| keyword | 3 |
| datatype | 41 |
| builtin.constant | 4 |
| sysvar | 93 |

## 带 verification 标注的条目

- switch（confirmed-user-correction）
- case（confirmed-user-correction）
- movej（confirmed-user-correction）
- ptp（confirmed-user-correction）
- lin（confirmed-user-correction）
- cir（confirmed-user-correction）
- ccir（confirmed-user-correction）
- spl（confirmed-user-correction）
- jump（confirmed-user-correction）
- waittime（confirmed-user-correction）
- accset（confirmed-user-correction）
- trigger（confirmed-user-correction）
- startcompen（confirmed-user-correction）
- print（confirmed-user-correction）
- setinterpercent（confirmed-user-correction）
- getinterpercent（confirmed-user-correction）
- setdo（confirmed-user-correction）
- syncdo（confirmed-user-correction）
- savesv（confirmed-user-correction）
- assert（confirmed-user-correction）
- switcharl（confirmed-user-correction）
- switchbackarl（confirmed-user-correction）
- modf（confirmed-user-correction）
- offset（confirmed-user-correction）
- reltool（confirmed-user-correction）
- geterror（confirmed-user-correction）
- open（confirmed-user-correction）
- close（confirmed-user-correction）
- writeregisters（confirmed-user-correction）
- P（confirmed-user-correction）
- weavedata（confirmed-user-correction）
- jvel（confirmed-user-correction）
- ToolInertiaPara（confirmed-user-correction）
- jttq（confirmed-user-correction）
- compendata（confirmed-user-correction）
- compendatajoint（confirmed-user-correction）
- PI（confirmed-user-correction）
- $I（confirmed-user-correction）
- $I_NAME（confirmed-user-correction）
- $S（confirmed-user-correction）
- $S_NAME（confirmed-user-correction）
- $B（confirmed-user-correction）
- $B_NAME（confirmed-user-correction）
- $D（confirmed-user-correction）
- $D_NAME（confirmed-user-correction）
- $P（confirmed-user-correction）
- $P_NAME（confirmed-user-correction）
- $PV1（confirmed-user-correction）
- $PV1_NAME（confirmed-user-correction）
- $PV2（confirmed-user-correction）
- $PV2_NAME（confirmed-user-correction）
- $PV3（confirmed-user-correction）
- $PV3_NAME（confirmed-user-correction）
- $PV4（confirmed-user-correction）
- $PV4_NAME（confirmed-user-correction）
- $PV5（confirmed-user-correction）
- $PV5_NAME（confirmed-user-correction）
- $PV6（confirmed-user-correction）
- $PV6_NAME（confirmed-user-correction）
- $PV7（confirmed-user-correction）
- $PV7_NAME（confirmed-user-correction）
- $PV8（confirmed-user-correction）
- $PV8_NAME（confirmed-user-correction）
- $PV9（confirmed-user-correction）
- $PV9_NAME（confirmed-user-correction）
- $J（confirmed-user-correction）
- $J_NAME（confirmed-user-correction）
- $TOOLS_NAME（confirmed-user-correction）
- $WOBJS_NAME（confirmed-user-correction）
- $BASE（confirmed-user-correction）
- $PI（confirmed-user-correction）
- $CTL_MODE（confirmed-user-correction）
- $RESET_POS_TYPE（confirmed-user-correction）
- $RESET_POS_THESHOLD（confirmed-user-correction）
- $DETECT_SOCK_CLOSE（confirmed-user-correction）
- $ERR_SOCK_CLOSED（confirmed-user-correction）
- $CHAN_ESTOP_STATE_DO（confirmed-user-correction）

## 说明

- manual_ref 统一写作"§章节（manual p.印刷页码）"；手册 PDF 页码 = 印刷页码 + 18。用户确认的实际控制器行为以条目说明为准。
