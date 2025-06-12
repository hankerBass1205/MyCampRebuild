'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import dynamic from 'next/dynamic'
import Swal from 'sweetalert2/dist/sweetalert2.js'
import 'sweetalert2/src/sweetalert2.scss'

// 動態載入 SunEditor，避免 SSR 錯誤
const SunEditor = dynamic(() => import('suneditor-react'), { ssr: false })
import 'suneditor/dist/css/suneditor.min.css'

const ModalReply = ({threadId, onUpdateSuccess, resetEditor, setResetEditor }) => {
  const { data: session } = useSession()
  const [editorData, setEditorData] = useState('')

  useEffect(() => {
    // 當父層的 resetEditor 變為 true 時，呼叫 updateEditorData 並重置父層狀態
    if (resetEditor) {
      updateEditorData('')
      setResetEditor(false)
    }
  }, [resetEditor, setResetEditor])

  // 新增函式用於更新 editorData
  const updateEditorData = (newData) => {
    setEditorData(newData)
  }


  useEffect(() => {
    // console.log("收到的 threadId:", threadId);
    // 這裡可以用 threadId 來讀取該文章的回覆資料
  }, [threadId]);

  // 檢查內容是否有效
  const isEditorContentValid = (content) => {
    let parser = new DOMParser();
    let doc = parser.parseFromString(content, "text/html");

    // 允許圖片，其他標籤移除
    // doc.querySelectorAll("img").forEach(img => img.replaceWith("[img]"));
    let textContent = doc.body.textContent.trim();

    return textContent.length > 0;
  };


  const handleSubmit = async () => {
    if (!editorData || editorData == '' || !isEditorContentValid(editorData)) {
      Swal.fire({
        title: '請填寫所有必要欄位!',
        html: '<div style="min-height:40px">你是不是漏了什麼沒填的呢？<br />( ˘•ω•˘ )</div>',
        icon: 'warning',
        draggable: false,
        showConfirmButton: false,
        timer: 2000,
      })
      return
    }

    const formData = new FormData()
    formData.append('threadId', threadId)
    formData.append('userId', session?.user?.id || '')
    formData.append('userName', session?.user?.name || '測試用戶')
    formData.append('userAvatar', session?.user?.image)
    formData.append('threadContent', editorData)
   

    try {
      const res = await fetch('/api/forum/reply', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()

      if (data.success) {

        Swal.fire({
          title: '回覆成功!',
          html: '<div style="min-height:40px">你的回覆已經順利發布囉！<br />(ゝ∀･)</div>',
          icon: 'success',
          draggable: false,
          showConfirmButton: false,
          timer: 2000,
        })
        

        // 觸發取消按鈕的 click 事件，關閉 Modal
        const cancelButton = document.querySelector('#replyModal [data-bs-dismiss="modal"]')
        if (cancelButton) {
          cancelButton.click()
        }

        // 更新頁面
        onUpdateSuccess && onUpdateSuccess()
      } else {
        alert('回覆失敗，請稍後再試')
      }
    } catch (error) {
      console.error('發文失敗:', error)
      alert('回覆失敗，請稍後再試')
    }
  }

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

  const resetForm = () => {
    setEditorData('')
    updateEditorData('')
  }

  return (
    <>
      <div
        className="modal fade"
        id="replyModal"
        tabIndex="-1"
        aria-labelledby="exampleModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-xl">
          <div className="modal-content border-0">
            <div className="modal-header border-0 pb-0">
              <h5 className="modal-title" id="exampleModalLabel">
                新增回覆
              </h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body pt-1 pb-0">
              <i className="fa-solid fa-align-justify icon"></i>回覆內容：
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
                <button
                  type="button"
                  className="btn btnCancel me-2"
                  data-bs-dismiss="modal"
                >
                  取消
                </button>
                <button
                  type="button"
                  className="btn btnCancel me-2"
                  id='replyreset'
                  onClick={resetForm}
                >
                  清空
                </button>
                <button
                  type="button"
                  className="btn btnSubmit"
                  onClick={handleSubmit}
                >
                  送出
                </button>
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default ModalReply
