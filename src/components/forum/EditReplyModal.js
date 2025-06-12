'use client'
import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Swal from 'sweetalert2/dist/sweetalert2.js'
import 'sweetalert2/src/sweetalert2.scss'

// 動態載入 SunEditor，避免 SSR 錯誤
const SunEditor = dynamic(() => import('suneditor-react'), { ssr: false })
import 'suneditor/dist/css/suneditor.min.css'

const EditReplyModal = ({ ReplyData, onUpdateSuccess }) => {
  const [modalData, setModalData] = useState({
    id: '',
    thread_content: '',
    status: '',
    floor: '',
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (ReplyData) {
      setModalData({
        id: ReplyData.id || '',
        thread_content: ReplyData.thread_content || '',
        status: ReplyData.status || '',
        floor: ReplyData.floor || '',
      })
      setEditorData(ReplyData.thread_content || '') // 初始化文章內容
      setThreadStatus(ReplyData.status) // 初始化文章狀態
    }
  }, [ReplyData]) // 只有當 data 變更時才更新 modalData
  // console.log('編輯文章的文章狀態 = ' + ReplyData.status)

  // 更新文章
  const handleUpdateThread = async () => {
    try {
      const response = await fetch(`/api/forum/update-reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          threadId: modalData.id,
          floor: modalData.floor,
          content: editorData,
          status: threadStatus,
        }),
      })

      const result = await response.json()
      if (response.ok) {
        // alert('回覆更新成功！')

        Swal.fire({
          title: '更新成功!',
          html: '<div style="min-height:40px">你的回覆已經順利更新囉！<br />(ゝ∀･)</div>',
          icon: 'success',
          draggable: false,
          showConfirmButton: false,
          timer: 1500,
        })

        // setTimeout(() => {
        //   window.location.reload() // 重新載入頁面
        // }, 1000) // 1000 毫秒 = 1 秒

        // 呼叫父元件的更新函式
        onUpdateSuccess && onUpdateSuccess()
      } else {
        throw new Error(result.message || '更新失敗')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // 文章內容圖片上傳操作
  const uploadImageToServer = async (file, uploadHandler) => {
    const formData = new FormData()
    formData.append('image', file)

    try {
      const response = await fetch('/api/forum/uploadContentImage', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      if (data.success) {
        uploadHandler({ result: [{ url: data.imageUrl }] })
      } else {
        alert('圖片上傳失敗')
      }
    } catch (error) {
      console.error('圖片上傳錯誤:', error)
      alert('圖片上傳錯誤')
    }
  }

  // -------------------------------------------------------------------------------------------------------------------
  // 文章狀態初始值設定
  const [threadStatus, setThreadStatus] = useState(ReplyData.status)
  // 變更文章內容重現方式
  const [editorData, setEditorData] = useState('')
  // 控制文章勾選狀態
  const handleCheckboxChange = () => {
    setThreadStatus(threadStatus === 0 ? 1 : 0)
    {
      console.log('文章溝選切換狀態 = ' + threadStatus)
    }
  }

  // -------------------------------------------------------------------------------------------------------------------

  return (
    <>
      <div
        className="modal fade"
        id="EditReplyModal"
        tabIndex="-1"
        aria-labelledby="exampleModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-xl">
          <div className="modal-content border-0">
            <div className="modal-header border-0 pb-0">
              <h5 className="modal-title" id="exampleModalLabel">
                修改回覆
              </h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body pt-1 pb-0">
              <i className="fa-solid fa-align-justify icon"></i>討論內容：
              <br></br>
              {/* SunEditor 編輯器 */}
              <SunEditor
                setContents={editorData}
                onChange={setEditorData}
                setOptions={{
                  buttonList: [
                    ['fontColor', 'hiliteColor', 'bold', 'italic', 'underline', 'strike'],
                    ['blockquote', 'removeFormat'],
                    ['image', 'link', 'video'],
                    ['fontSize', 'formatBlock'],
                  ],
                  minHeight: '200px',
                }}
                onImageUploadBefore={(files, info, uploadHandler) => {
                  // info.preventDefault() // 確保 info.preventDefault() 可用
                  uploadImageToServer(files[0], uploadHandler)
                }}
              />
            </div>

            <div className="modal-footer express-footer">
              <p>討論請注意禮節與尊重他人，良好的交流需要你我共同維護。</p>
              <span>
                <span>
                  文章狀態 -{' '}
                  {ReplyData.status == 1 ? (
                    <span className="text-success">上架中</span>
                  ) : (
                    <span className="text-danger">下架中</span>
                  )}
                </span>
                <div className="form-check d-inline-block me-2 ps-5">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="exampleCheck1"
                    checked={threadStatus == 0}
                    onChange={handleCheckboxChange}
                  />
                  <label className="form-check-label" htmlFor="exampleCheck1">
                    <p>下架討論串</p>
                  </label>
                </div>
                <button
                  type="button"
                  className="btn btnCancel me-2"
                  data-bs-dismiss="modal"
                >
                  取消
                </button>
                <button
                  type="button"
                  className="btn btnSubmit"
                  onClick={handleUpdateThread}
                  data-bs-dismiss="modal"
                >
                  更新
                </button>
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default EditReplyModal
