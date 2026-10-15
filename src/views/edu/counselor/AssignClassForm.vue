<template>
  <Dialog v-model="dialogVisible" title="分配班级" width="600">
    <el-form ref="formRef" v-loading="formLoading" :model="formData" :rules="formRules" label-width="110px">
      <el-form-item label="导员姓名">
        <el-input :model-value="counselorName" disabled placeholder="导员姓名" />
      </el-form-item>
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
      <el-form-item label="说明">
        <span class="text-#909399 text-xs">班级分配为全量覆盖；每个班级仅能由一个导员作为主辅导员持有。</span>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script lang="ts" setup>
import * as CounselorApi from '@/api/edu/counselor'

defineOptions({ name: 'EduCounselorAssignClass' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const dialogVisible = ref(false) // 弹窗的是否展示
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const counselorId = ref<number>() // 当前分配班级的导员编号
const counselorName = ref('') // 当前分配班级的导员姓名
const formData = ref({
  classIds: [] as number[]
})
const formRules = reactive({
  classIds: [
    {
      required: true,
      type: 'array',
      message: '所带班级不能为空',
      trigger: 'change'
    }
  ]
})
const formRef = ref() // 表单 Ref

/** 打开弹窗 */
const open = async (row: CounselorApi.CounselorVO) => {
  dialogVisible.value = true
  counselorId.value = row.id
  counselorName.value = row.name
  formData.value.classIds = []
  formRef.value?.clearValidate()
  // 回填已分配的班级编号
  formLoading.value = true
  try {
    const ids = await CounselorApi.getCounselorClassIds(row.id!)
    formData.value.classIds = ids || []
  } finally {
    formLoading.value = false
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
    await CounselorApi.assignCounselorClasses({
      counselorId: counselorId.value!,
      classIds: formData.value.classIds
    })
    message.success(t('common.updateSuccess'))
    dialogVisible.value = false
    // 发送操作成功的事件
    emit('success')
  } finally {
    formLoading.value = false
  }
}
</script>