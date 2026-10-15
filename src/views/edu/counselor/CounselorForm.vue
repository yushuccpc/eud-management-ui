<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" width="700">
    <el-form ref="formRef" v-loading="formLoading" :model="formData" :rules="formRules" label-width="90px">
      <el-row>
        <el-col :span="12">
          <el-form-item label="工号" prop="code">
            <el-input v-model="formData.code" placeholder="请输入工号" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="姓名" prop="name">
            <el-input v-model="formData.name" placeholder="请输入姓名" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="手机号" prop="mobile">
            <el-input v-model="formData.mobile" maxlength="11" placeholder="请输入手机号" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="职称" prop="title">
            <el-input v-model="formData.title" placeholder="请输入职称" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="所属院系" prop="departmentId">
            <el-tree-select
              v-model="formData.departmentId"
              :data="deptList"
              :props="defaultProps"
              check-strictly
              node-key="id"
              placeholder="请选择所属院系"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="状态" prop="status">
            <el-select v-model="formData.status" clearable placeholder="请选择状态">
              <el-option
                v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="密码" prop="password">
            <el-input v-model="formData.password" maxlength="16" placeholder="新增可留空自动生成；修改留空不修改" />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="所带班级" prop="classIds">
            <!--
              班级下拉数据源：后端暂未提供班级下拉列表接口（ClassApi 为 Java 侧校验契约），
              此处暂用 allow-create 多选占位以便录入班级编号；班级模块就绪后应替换为
              el-select 并绑定真实班级下拉数据源（value=编号、label=名称）。
            -->
            <el-select
              v-model="formData.classIds"
              multiple
              filterable
              allow-create
              default-first-option
              placeholder="请选择或录入所带班级编号"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="备注" prop="remark">
            <el-input v-model="formData.remark" placeholder="请输入备注" type="textarea" />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script lang="ts" setup>
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { CommonStatusEnum } from '@/utils/constants'
import { defaultProps, handleTree } from '@/utils/tree'
import * as DeptApi from '@/api/system/dept'
import * as CounselorApi from '@/api/edu/counselor'

defineOptions({ name: 'EduCounselorForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined,
  code: '',
  name: '',
  mobile: '',
  title: '',
  departmentId: undefined,
  password: '',
  status: CommonStatusEnum.ENABLE,
  remark: '',
  classIds: [] as number[]
})
const formRules = reactive({
  code: [{ required: true, message: '工号不能为空', trigger: 'blur' }],
  name: [{ required: true, message: '姓名不能为空', trigger: 'blur' }],
  mobile: [
    { required: true, message: '手机号不能为空', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }
  ]
})
const formRef = ref() // 表单 Ref

// 院系树数据
const deptList = ref([])

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  // 加载院系树
  deptList.value = handleTree(await DeptApi.getSimpleDeptList())
  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      const data = (await CounselorApi.getCounselor(id)) as CounselorApi.CounselorVO
      // 后端 /get 已返回 classIds；若未返回，则回落调用 /list-classes 回填
      if (!data.classIds || data.classIds.length === 0) {
        data.classIds = await CounselorApi.getCounselorClassIds(id)
      }
      formData.value = { ...(data as any), classIds: data.classIds || [] }
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 提交表单 */
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
const submitForm = async () => {
  // 校验表单
  if (!formRef) return
  const valid = await formRef.value.validate()
  if (!valid) return
  // 提交请求
  formLoading.value = true
  try {
    const data = formData.value as unknown as CounselorApi.CounselorVO
    if (formType.value === 'create') {
      await CounselorApi.createCounselor(data)
      message.success(t('common.createSuccess'))
    } else {
      await CounselorApi.updateCounselor(data)
      message.success(t('common.updateSuccess'))
    }
    dialogVisible.value = false
    // 发送操作成功的事件
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    id: undefined,
    code: '',
    name: '',
    mobile: '',
    title: '',
    departmentId: undefined,
    password: '',
    status: CommonStatusEnum.ENABLE,
    remark: '',
    classIds: []
  } as any
  formRef.value?.resetFields()
}
</script>