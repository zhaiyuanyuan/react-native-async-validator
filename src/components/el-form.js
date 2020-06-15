import React, { Component } from 'react';
import {
  StyleSheet,
} from 'react-native';
import schema from 'async-validator';
import PropTypes from 'prop-types'; // ES6
import ThemeContext from "./context"
class elForm extends Component {
  constructor(props) {
    super(props);
    this.state = {
      fields: [],
      descriptor: {},//符合‘async-validator’要求的格式
      model: {}
    };
    this.validator = {};
    //确保子节点添加事件时候能准确添加到本表单
    this.CusRefName = "form" + new Date().getTime();

  }
  componentDidMount() {
    //prop是否符合规范监测
    // this._wranCheck();
    // this.props.canPushChange(true);
  }
  componentDidUpdate(prevProps) {
    console.log("will receive", this.props, prevProps)
    // console.log("form--------------###:prevProps.props",prevProps,"==","state",this.state.model)
    try {
      for (let i in this.props) {
        if (prevProps[i] !== this.props[i] && i !== 'children' && i !== 'canpush' && i !== 'canPushChange') {
          //  console.log("prevProps[i]!==this.props[i]",prevProps[i]!==this.props[i],i)

          let formItem;
          //数组
          if (Array.isArray(this.props[i])) {
            // //如果是删除操作，就不再校验改formItem，因为可以已销毁
            // if(this.props[i].length<prevProps[i].length){
            //   console.log("删除炒作",this.props[i],prevProps[i])
            //   let index='nothing';
            //   let deleItem= prevProps[i].filter((FormItem,itemIndex)=>{
            //     let t=this.props[i].every(el=>el.key!=FormItem.key)
            //     console.log("t",t);
            //     if(t){
            //       index=itemIndex;
            //     }
            //     return t;
            //   })[0];
            //    console.log("被删除的元素",deleItem,this.state.fields,index)
            //    this.$removeFieldSubScriber(`${i}.${index}.value`);
            //   return;
            // }
            try {
              for (let index = 0; index < this.props[i].length; index++) {
                this.state.fields.forEach(FormItem => {
                  if (FormItem.props.prop == `${i}.${index}.value` && this.props[i][index] != prevProps[i][index]) {
                    console.log("FormItem.props.prop", FormItem.props.prop, `${i}.${index}.value`, this.props[i][index], prevProps[i][index])
                    this.$acceptCheckField(FormItem);
                  }

                })
              }
            } catch (e) {
              console.log("error", e)
            }


          }
          else{

            formItem = this.state.fields.filter(FormItem => FormItem.props.prop == i)[0];
            this.$acceptCheckField(formItem);
            console.log("form-map formItem", formItem, "i===", i, 'fields', this.state.fields)

          }
        }
      }
    } catch (e) {
     console.log("error",e)
    }

    return false;


  }
  render() {
    return (
      <ThemeContext.Provider value={{ model: this.props, elForm: this }}>
        {this.props.children}
      </ThemeContext.Provider>
    )

  }
  /**
   * 新增元素elFormItem,他的props是
   *  obj {Object}
   * {
   *   prop:"string",
   *   rules="[
   *    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
   *   { type: 'email', message: '请输入正确的邮箱地址', trigger: ['blur', 'change'] }
   *  ]"
   *  }
   */
  $addFieldSubScriber(obj) {
    let fields = this.state.fields;
    //不允许重复追加，开启开发环境热更也会重复触发追加(这行代码能避免)
    // elFormItem.props.prop
    if (fields.findIndex(item => item.props.prop == obj.props.prop) > -1) {
      // console.warn(`已禁止重复提交的fields:${obj.prop},如果是开发环境热更导致的请忽视警告`)
      return;
    }
    fields.push(obj);
    this.setState({ fields }, () => {
      this.updateDescriptor(() => this.updateCanPush());
    });

  }
  /**
 * 新增元素
 *  obj {Object}
 * {
 *   prop:"string",
 *   rules="[
 *    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
 *   { type: 'email', message: '请输入正确的邮箱地址', trigger: ['blur', 'change'] }
 *  ]"
 *  }
 */
  $removeFieldSubScriber(formItem) {
    //  console.log("this.state.fields $",this.state.fields,formItem.props.prop)
    try {
      for(let i=0;i<this.state.fields.length;i++){
        //删除第一个同名key的，后面的会自动补回来，否则会出现
          if(this.state.fields[i].props.prop=== formItem.props.prop){
            this.state.fields.splice(i,1);
            // console.log("匹配到要卸载的",this.state.fields)
            break;
          }
      }
      this.setState({ fields:[...this.state.fields] }, () => {
        //  console.log("卸载后的剩余的fields",this.state.fields)
        this.updateDescriptor(() => this.updateCanPush());
      });
    } catch (e) {
      console.log("$removeFieldSubScriber error",e)
    }
  }
  /**
   * 更新‘async-validator’的校验数据
   * @param {function} func  更新数据后的回调
   */
  updateDescriptor(func) {
    let descriptor = {};
    this.state.fields.forEach(formItem => {
      if (formItem.props.rules) {
        if (!formItem.props.prop) {
          console.warn("校验表单缺少prop")
        }
        else {
          descriptor[formItem.props.prop] = formItem.props.rules;
        }
      }
    })
    this.setState({ descriptor }, () => {
      this.validator = new schema(this.state.descriptor);
      typeof func == "function" ? func() : null;
    });
  }
  /**
   * model里面是否包含指定的key
   * 需要做数组和对象的区分
   */
  modelContain(key) {
    let keys = key ? key.split(".") : [];
    //   console.log("keys",keys,key)
    if (keys.length > 1) {
      //   console.log("进入多个的了?")
      let obj = this.props;
      for (let v = 0; v < keys.length; v++) {
        if (this.hasOwnPropertyFuc(obj, keys[v])) {
          obj = obj[keys[v]];
        }
        else {
          return false;
        }
      }
      return true;
    }
    else {
      return this.hasOwnPropertyFuc(this.props, key);
    }
    // return this.props.model.hasOwnProperty(key); 
  }
  /**
   * 判定obj是否包括key这个【key】
   * @param {*} obj 
   * @param {*} key 
   */
  hasOwnPropertyFuc(obj, key) {
    return obj.hasOwnProperty(key);
  }
  /**
   * 获取Fied的值
   * @param {string}
   * 调用前请使用this.modelContain判定是否存在改值，避免报错
   */
  getFiedValue(key) {
    try {
      let keys = key ? key.split(".") : [];
      if (keys.length > 1) {
        let result = this.props;
        for (let v = 0; v < keys.length; v++) {
          result = result[keys[v]];
        }
        return result;
      }
      else {
        console.log("key", key, this.props, this.props[key])
        return this.props[key];
      }
    } catch (e) {
      console.log("err", e)
    }
  }
  /**
   * 因为model可能是包含数组的对象，所以需要特别处理
   */
  getModel() {
    try {
      let model = {};
      for (let k in this.props) {
        if (k !== 'canPushChange' && k !== 'children' && k !== 'labelWidth') {
          model[k] = this.props[k];
        }
      }
      // console.log("his.state.fields[0]",this.state.fields[0])
      //针对
      let fieldsKeys = [];
      if (this.state.fields[0]&&this.state.fields[0].props
        && this.state.fields[0].props.prop) {
        fieldsKeys = this.state.fields[0].props.prop.split(".");
      }
      if (fieldsKeys.length) {
        model = {};
        for (let v = 0; v < this.state.fields.length; v++) {
          let field = this.state.fields[v].props.prop;
          let fieldValue = this.getFiedValue(field);//获取表单的值(field可能是“xx.xx”的格式)
          model[field] = fieldValue;
        }
      }
      return model;
    } catch (e) {
      console.log("err", e)
    }

  }
  /**
   * 校验单个表单
   * @param {string} field 
   * @param {*} callBack 
   */
  _validateField(field, callBack) {
    console.log("校验单个值~~", field)

    return new Promise((resolve) => {
      if (!this.modelContain(field)) {
        console.log("fields", this.state.fields)
        console.warn(`model不存在key:${field}`)
        resolve(`model不存在key:${field}`);
        return;
      }
      let target = {
        [field]: this.state.descriptor[field]
      };
      console.log("tarhget", target)
      let valider = new schema(target);
      let fieldValue = this.getFiedValue(field);//获取表单的值(field可能是“xx.xx”的格式)
      valider.validate({ [field]: fieldValue }, (errors, fields) => {
        callBack(errors && errors[0] ? errors[0] : null, fields)
      });

      this.updateCanPush();


    })
  }
  /**
   * 更新是提价按钮是否可以提交
   */
  updateCanPush() {
    try {
      let { canPushChange } = this.props;
      if (typeof canPushChange === "function") {
        // 校验所有表单，但是不通知表单
        if (typeof this.validate === "function") {
          // alert("势函数")
          this.validate((errors, fields) => {
            console.log("errors==", errors)
            try {
              errors ? canPushChange(false) : canPushChange(true);
            } catch (e) {
              console.log("err",e)
            }

          }, false)
        }


      }
      else if (canPushChange && typeof canPushChange !== "function") {
        console.warn("prop canPush should be a function")
      }
    } catch (e) {
      console.log("err", e)
    }
  }
  /**
   *  校验所有表单
   * @param {*} callBack 
   * @param {boolean} notify 是否不通知表单
   */
  validate(callBack, notify = true) {
    let model = this.getModel();
    console.log("全部表单校验", model,this.state.fields)
    if (!this.validator.validate) {
      return;
    }
    return this.validator.validate(model, (errors, fields) => {
      try {
        notify ? this.notifyAllFields(errors) : null;
      } catch (e) {
        console.warn("校验异常", e)
      }
      callBack(errors, fields)
    });
  }


  /**
   * 对外开放的校验单个表单接口
   * @param {string} key
   */
  validateField(key) {
    this.acceptCheckField("", { prop: key });
  }
  /**
   * 清空校验效果，但是不清空值
   */
  clearValidate() {
    // PubSub.publish(`${this.CusRefName}${ENUM.clearValidate}`);
  }
  /**
   * 通过数组里面的对象的key来获取指定数组元素
   * @param {*} arr 
   * @param {*} key 
   * @param {*} val
   */
  getArrayItemByKey(arr, key, val) {
    if (!arr) {
      return null;
    }
    return arr.filter(item => item[key] == val)[0];
  }
  /**
   * 通知所有表单校验结果
   * @param {*} errorsArr 
   */
  notifyAllFields(errorsArr = []) {
    for (let k in this.state.descriptor) {
      let formItem = this.state.fields.filter(formItem => formItem.props.prop === k)
      let errorItem = errorsArr ? errorsArr.filter(item => item.field === k) : [];
      console.log("error  form:", formItem[0], errorItem[0])
      if (formItem[0]) {
        formItem[0].$accetpCheckedResult(errorItem[0]);
      }
    }
  }
  /**
 * 接收到[单个]表单请求校验后，开始校验并反馈结果
 * @param {*} msg  key
 * @param {*} obj 
 * obj.prop
 */
  $acceptCheckField(formItem) {
    console.log("接收到表单的请求，开始校验", formItem.props.prop)
    this._validateField(formItem.props.prop, (errors, fields) => {
      console.log("校验单个", errors)
      formItem.$accetpCheckedResult(errors);
    })
  }

}

elForm.propTypes = {
  canPushChange: PropTypes.oneOfType([
    PropTypes.function,
    undefined
  ]),
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  }
});
export default elForm;
