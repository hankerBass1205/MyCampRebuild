'use client'
import React from 'react'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import dynamic from 'next/dynamic'
import Swal from 'sweetalert2/dist/sweetalert2.js'
import 'sweetalert2/src/sweetalert2.scss'

// 動態載入 SunEditor，避免 SSR 錯誤
const SunEditor = dynamic(() => import('suneditor-react'), { ssr: false })
import 'suneditor/dist/css/suneditor.min.css'

const Modalexpress = ({ onResetCategory }) => {
  const { data: session } = useSession()
  const [imagePreview, setImagePreview] = useState('')
  const [editorData, setEditorData] = useState('')
  const [titleType, setTitleType] = useState('0')
  const [category, setCategory] = useState('0')
  const [title, setTitle] = useState('')
  const [uploadImage, setUploadImage] = useState(null)


  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
      setUploadImage(file)
    }
  }

  const resetImagePreview = () => {
    setImagePreview('')
    setUploadImage(null)
  }

  const getDefaultImage = () => {
    if (imagePreview) return imagePreview
    const defaultImages = {
      1: '/images/forum/liImg_sample_01.png',
      2: '/images/forum/liImg_sample_02.png',
      3: '/images/forum/liImg_sample_03.png',
      4: '/images/forum/liImg_sample_04.png',
      5: '/images/forum/liImg_sample_05.png',
    }
    return defaultImages[titleType]
  }

  const uploadImageFile = async () => {
    if (!uploadImage) return getDefaultImage()

    const formData = new FormData()
    formData.append('image', uploadImage)

    try {
      const res = await fetch('/api/forum/uploadImage', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      return data.imageUrl || getDefaultImage()
    } catch (error) {
      return getDefaultImage()
    }
  }


  const handleSubmit = async () => {
    if (category === '0' || titleType === '0' || !title || title == '' || !editorData || editorData == '') {
      Swal.fire({
        title: '請選擇並填寫所有必要欄位!',
        html: '<div style="min-height:40px">你是不是漏了什麼沒填的呢？<br />( ˘•ω•˘ )</div>',
        icon: 'warning',
        draggable: false,
        showConfirmButton: false,
        timer: 2000,
      })
      return
    }

    const threadImage = await uploadImageFile()

    const formData = new FormData()
    formData.append('userId', session?.user?.id || '')
    formData.append('userName', session?.user?.name || '測試用戶')
    formData.append('userAvatar', session?.user?.image)
    formData.append('category', category)
    formData.append('titleType', titleType)
    formData.append('threadTitle', title)
    formData.append('threadContent', editorData)
    formData.append('threadImage', threadImage)

    try {
      const res = await fetch('/api/forum/create', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()

      if (data.success) {
        Swal.fire({
          title: '發文成功!',
          html: '<div style="min-height:40px">你的發文已經順利發布囉！<br />(ゝ∀･)</div>',
          icon: 'success',
          draggable: false,
          showConfirmButton: false,
          timer: 2000,
        })
        // 觸發取消按鈕的 click 事件，關閉 Modal
        const cancelButton = document.querySelector('#expressModal [data-bs-dismiss="modal"]')
        if (cancelButton) {
          cancelButton.click()
        }
        // 重設表單
        resetForm()
        // 啟動更新
        onResetCategory?.()
      } else {
        alert('發文失敗，請稍後再試')
      }
    } catch (error) {
      console.error('發文失敗:', error)
      alert('發文失敗，請稍後再試')
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
    setTitle('')
    setEditorData('')
    setTitleType('0')
    setCategory('0')
    setImagePreview('')
    setUploadImage(null)
  }

  return (
    <>
      <div
        className="modal fade"
        id="expressModal"
        tabIndex="-1"
        aria-labelledby="exampleModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-xl">
          <div className="modal-content border-0">
            <div className="modal-header border-0 pb-0">
              <h5 className="modal-title" id="exampleModalLabel">
                新增討論
              </h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body pt-1 pb-0">
              <div className="categoryBox d-flex align-items-center">
                <i className="fa-solid fa-list-ul icon"></i>
                <span>討論分類：</span>
                <select
                  className="form-select selectType"
                  onChange={(e) => setCategory(e.target.value)}
                  value={category} // 確保 value 綁定 category
                >
                  <option value="0">請選擇</option>
                  <option value="1">好物分享</option>
                  <option value="2">營地見聞</option>
                  <option value="3">活動揪團</option>
                  <option value="4">露營知識</option>
                  <option value="5">露友閒聊</option>
                </select>
                <i className="fa-solid fa-list-ul icon rwd"></i>
                <span>發文分類：</span>
                <select
                  className="form-select selectType"
                  onChange={(e) => setTitleType(e.target.value)}
                  value={titleType} // 確保 value 綁定 category
                >
                  <option value="0">請選擇</option>
                  <option value="1">心得</option>
                  <option value="2">問題</option>
                  <option value="3">討論</option>
                  <option value="4">情報</option>
                  <option value="5">閒聊</option>
                </select>
              </div>
              <div className="threadImg d-flex align-items-end mb-3">
                <span>
                  <i className="fa-solid fa-image icon"></i>封面圖片：<br></br>
                  <input
                    type="file"
                    className="form-control inputImg"
                    onChange={handleImageChange}
                    accept="image/*"
                  />
                </span>

                <button
                  type="button"
                  className="btnReset"
                  onClick={resetImagePreview}
                >
                  清空
                </button>
                <div className="forumLiBox1 express">
                  <div className="thread_image">
                    <img
                      id="preview_img"
                      className="imgPreview"
                      src={getDefaultImage()}
                      alt="Preview"
                    />
                  </div>
                </div>
              </div>
              <i className="fa-solid fa-message icon"></i>討論題目：<br></br>
              <input
                type="text"
                className="form-control mt-1 mb-3"
                placeholder="請輸入標題名稱..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
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
                  minHeight: '350px',
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

export default Modalexpress
