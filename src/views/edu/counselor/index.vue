<template>
  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form class="-mb-15px" :model="queryParams" ref="queryFormRef" :inline="true" label-width="68px">
      <el-form-item label="姓名" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入导员姓名"
          clearable
          class="!w-200px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="工号" prop="code">
        <el-input
          v-model="queryParams.code"
          placeholder="请输入工号"
          clearable
          class="!w-200px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="手机号" prop="mobile">
        <el-input
          v-model="queryParams.mobile"
          placeholder="请输入手机号"
          clearable
          class="!w-200px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="院系" prop="departmentId">
        <el-tree-select
          v-model="queryParams.departmentId"
          :data="deptList"
          :props="defaultProps"
          check-strictly
          node-key="id"
          clearable
          placeholder="请选择院系"
          class="!w-200px"
        />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择状态" clearable class="!w-200px">
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
        <el-button type="primary" plain @click="openForm('create')" v-hasPermi="['edu:counselor:create']">
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list">
      <el-table-column label="工号" align="center" prop="code" />
      <el-table-column label="姓名" align="center" prop="name" />
      <el-table-column label="手机号" align="center" prop="mobile" width="130" />
      <el-table-column label="职称" align="center" prop="title" />
      <el-table-column label="院系" align="center" prop="departmentId" width="140">
        <template #default="scope">
          {{ deptNameMap[scope.row.departmentId] || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="状态" align="center" prop="status">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" min-width="150" show-overflow-tooltip />
      <el-table-column
        label="创建时间"
        align="center"
        prop="createTime"
        width="180"
        :formatter="dateFormatter"
      />
      <el-table-column label="操作" align="center" width="220">
        <template #default="scope">
          <el-button link type="primary" @click="openForm('update', scope.row.id)" v-hasPermi="['edu:counselor:update']">
            编辑
          </el-button>
          <el-button link type="warning" @click="openAssign(scope.row)" v-hasPermi="['edu:counselor:update']">
            分配班级
          </el-button>
          <el-button link type="danger" @click="handleDelete(scope.row.id)" v-hasPermi="['edu:counselor:delete']">
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <!-- 分页 -->
    <Pagination
      :total="total"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />
  </ContentWrap>

  <!-- 表单弹窗：添加/修改 -->
  <CounselorForm ref="formRef" @success="getList" />
  <!-- 分配班级弹窗 -->
  <AssignClassForm ref="assignFormRef" @success="getList" />
</template>
<script lang="ts" setup>
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import { defaultProps, handleTree } from '@/utils/tree'
import * as DeptApi from '@/api/system/dept'
import * as CounselorApi from '@/api/edu/counselor'
import CounselorForm from './CounselorForm.vue'
import AssignClassForm from './AssignClassForm.vue'

defineOptions({ name: 'EduCounselor' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const total = ref(0) // 列表的总页数
const list = ref([]) // 列表的数据
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  name: '',
  code: '',
  mobile: '',
  departmentId: undefined,
  status: undefined
})
const queryFormRef = ref() // 搜索的表单

// 院系数据（用于查询、表格展示）
const deptList = ref([])
const deptNameMap = ref<Record<number, string>>({})

/** 查询导员列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await CounselorApi.getCounselorPage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value.resetFields()
  handleQuery()
}

/** 加载院系下拉数据 */
const loadDeptOptions = async () => {
  const depts = await DeptApi.getSimpleDeptList()
  deptList.value = handleTree(depts)
  const map: Record<number, string> = {}
  depts.forEach((d) => (map[d.id] = d.name))
  deptNameMap.value = map
}

/** 添加/修改操作 */
const formRef = ref()
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id)
}

/** 打开分配班级弹窗 */
const assignFormRef = ref()
const openAssign = (row: CounselorApi.CounselorVO) => {
  assignFormRef.value.open(row)
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    // 删除的二次确认
    await message.delConfirm()
    // 发起删除
    await CounselorApi.deleteCounselor(id)
    message.success(t('common.delSuccess'))
    // 刷新列表
    await getList()
  } catch {}
}

/** 初始化 **/
onMounted(() => {
  getList()
  loadDeptOptions()
})
</script>