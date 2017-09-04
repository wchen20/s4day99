/**
 * Created by Administrator on 2017/8/2.
 */
(function (jq) {

    var GLOBAL_DICT = {};
    /*
    {
        'device_type_choices': (
                                    (1, '服务器'),
                                    (2, '交换机'),
                                    (3, '防火墙'),
                                )
        'device_status_choices': (
                                    (1, '上架'),
                                    (2, '在线'),
                                    (3, '离线'),
                                    (4, '下架'),
                                )
    }
     */

    // 为字符串创建format方法，用于字符串格式化
    String.prototype.format = function (args) {
        return this.replace(/\{(\w+)\}/g, function (s, i) {
            return args[i];
        });
    };

    function initial(url) {
        $.ajax({
            url: url,
            type: 'GET',  // 获取数据
            dataType: 'JSON',
            success: function (arg) {
                $.each(arg.global_dict,function(k,v){
                     GLOBAL_DICT[k] = v
                });

                /*
                 {
                 'server_list':list(server_list), # 所有数据
                 'table_config':table_config      # 所有配置
                  'global_dict':{
                        'device_type_choices': (
                                                    (1, '服务器'),
                                                    (2, '交换机'),
                                                    (3, '防火墙'),
                                                )
                        'device_status_choices': (
                                                    (1, '上架'),
                                                    (2, '在线'),
                                                    (3, '离线'),
                                                    (4, '下架'),
                                                )
                    }
                 }
                 */
                initTableHeader(arg.table_config);
                initTableBody(arg.server_list, arg.table_config);
            }
        })
    }

    function initTableHeader(tableConfig) {
        /*
         [
         {'q':'id','title':'ID'},
         {'q':'hostname','title':'主机名'},
         ]
         */
        $.each(tableConfig, function (k, v) {
            if (v.display) {
                var tag = document.createElement('th');
                tag.innerHTML = v.title;
                $('#tbHead').find('tr').append(tag);
            }
        })
    }

    function initTableBody(serverList, tableConfig) {
        /*
         serverList = [
         {'id': 1, 'hostname':c2.com, create_at: xxxx-xx-xx-},
         {'id': 1, 'hostname':c2.com, create_at: xxxx-xx-xx-},
         {'id': 1, 'hostname':c2.com, create_at: xxxx-xx-xx-},
         {'id': 1, 'hostname':c2.com, create_at: xxxx-xx-xx-},
         ]
         */
        $.each(serverList, function (k, row) {
            // row: {'id': 1, 'hostname':c2.com, create_at: xxxx-xx-xx-}
            /*
             <tr>
             <td>id</td>
             <td>hostn</td>
             <td>create</td>
             </tr>
             */
            var tr = document.createElement('tr');
            $.each(tableConfig, function (kk, rrow) {
                // kk: 1  rrow:{'q':'id','title':'ID'},         // rrow.q = "id"
                // kk: .  rrow:{'q':'hostname','title':'主机名'},// rrow.q = "hostname"
                // kk: .  rrow:{'q':'create_at','title':'创建时间'}, // rrow.q = "create_at"
                if (rrow.display) {
                    var td = document.createElement('td');

                    /* 在td标签中添加内容 */
                    var newKwargs = {}; // {'n1':'1','n2':'123'}
                    $.each(rrow.text.kwargs, function (kkk, vvv) {
                        var av = vvv;
                        if(vvv.substring(0,2) == '@@'){
                            var global_dict_key = vvv.substring(2,vvv.length);
                            var nid = row[rrow.q];
                            $.each(GLOBAL_DICT[global_dict_key],function(gk,gv){
                                if(gv[0] == nid){
                                    av = gv[1];
                                }
                            })
                        }
                        else if (vvv[0] == '@') {
                            av = row[vvv.substring(1, vvv.length)];
                        }
                        newKwargs[kkk] = av;
                    });
                    var newText = rrow.text.tpl.format(newKwargs);
                    td.innerHTML = newText;

                    /* 在td标签中添加属性 */
                    $.each(rrow.attrs,function(atkey,atval){
                        // 如果@
                        if (atval[0] == '@') {
                            td.setAttribute(atkey, row[atval.substring(1, atval.length)]);
                        }else{
                            td.setAttribute(atkey,atval);
                        }
                    });

                    $(tr).append(td);
                }
            });
            $('#tbBody').append(tr);

        })
    }

    function trIntoEdit($tr){
        $tr.find('td[edit-enable="true"]').each(function(){
            // $(this) 每一个td
            var editType = $(this).attr('edit-type');
            if(editType == 'select'){
                // 生成下拉框:找到数据源
                var deviceTypeChoices = GLOBAL_DICT[$(this).attr('global_key')];

                // 生成select标签
                var selectTag = document.createElement('select');
                var origin = $(this).attr('origin');

                $.each(deviceTypeChoices,function(k,v){
                    var option = document.createElement('option');
                    $(option).text(v[1]);
                    $(option).val(v[0]);
                    if(v[0] == origin){
                        // 默认选中原来的值
                        $(option).prop('selected',true);
                    }
                    $(selectTag).append(option);
                });

                $(this).html(selectTag);
                // 显示默认值
            }else{
                // 获取原来td中的文本内容
                var v1 = $(this).text();
                // 创建input标签，并且内部设置值
                var inp = document.createElement('input');
                $(inp).val(v1);
                // 添加到td中
                $(this).html(inp);
            }


        });
    }
    function trOutEdit($tr){
        $tr.find('td[edit-enable="true"]').each(function(){
            // $(this) 每一个td
            var editType = $(this).attr('edit-type');
            if(editType == 'select'){
                var option = $(this).find('select')[0].selectedOptions;
                $(this).html($(option).text());
            }else{
                var inputVal = $(this).find('input').val();
                $(this).html(inputVal);
            }

        });
    }
    jq.extend({
        xx: function (url) {
            initial(url);

            $('#tbBody').on('click',':checkbox',function(){
                // $(this) // checkbox标签
                // 1. 检测是否已经被选中
                var $tr = $(this).parent().parent();
                if($(this).prop('checked')){
                    // 进入编辑模式
                    trIntoEdit($tr);
                }else{
                    // 退出编辑模式
                    trOutEdit($tr);
                }
            })

        }
    })
})(jQuery);