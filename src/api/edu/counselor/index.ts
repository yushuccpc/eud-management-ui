import request from '@/config/axios'

export interface CounselorVO {
  id?: number
  code: string
  name: string
  mobile: string
  title: string
  departmentId?: number
  password?: string
  userId?: number
  status?: number
  remark: string
  classIds?: number[]
  createTime?: Date
}

// 对外契约：导员与班级关系（分配班级）
export interface CounselorAssignClassVO {
  counselorId: number
  classIds: number[]
}

// 查询导员分页
export const getCounselorPage = async (params: PageParam & Partial<CounselorVO> & { classId?: number }) => {
  return await request.get({ url: '/edu/counselor/page', params })
}

// 获取导员列表（下拉选择）
export const getCounselorList = async (): Promise<CounselorVO[]> => {
  return await request.get({ url: '/edu/counselor/list' })
}

// 查询导员详情（含所带班级编号集合）
export const getCounselor = async (id: number): Promise<CounselorVO> => {
  return await request.get({ url: '/edu/counselor/get?id=' + id })
}

// 查询导员所带班级编号集合
export const getCounselorClassIds = async (counselorId: number): Promise<number[]> => {
  return await request.get({ url: '/edu/counselor/list-classes?counselorId=' + counselorId })
}

// 新增导员
export const createCounselor = async (data: CounselorVO) => {
  return await request.post({ url: '/edu/counselor/create', data })
}

// 修改导员
export const updateCounselor = async (data: CounselorVO) => {
  return await request.put({ url: '/edu/counselor/update', data })
}

// 分配所带班级（全量覆盖）
export const assignCounselorClasses = async (data: CounselorAssignClassVO) => {
  return await request.put({ url: '/edu/counselor/assign-classes', data })
}

// 删除导员
export const deleteCounselor = async (id: number) => {
  return await request.delete({ url: '/edu/counselor/delete?id=' + id })
}