import { useSession } from 'next-auth/react'
import { useState, useEffect } from "react"
import { useParams } from 'next/navigation'
import Swal from 'sweetalert2/dist/sweetalert2.js'
import 'sweetalert2/src/sweetalert2.scss'

// 接收 props
const ThreadList = ({ setResetEditor, threadStatus }) => {

  const { data: session, status } = useSession()
  // console.log(session.user.id); // 取得使用者ID
  const { id } = useParams()
  // console.log(id) // 取得此篇文章ID
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (session) {
      fetch(`/api/forum/threadlist-favorite/check?user_id=${session.user.id}&forum_id=${id}`)
        .then((res) => res.json())
        .then((data) => {
          setIsFavorite(data.isFavorite);
        });
    }
  }, [session, id]);

  const handleFavorite = async () => {
    if (!session) {
      Swal.fire({
        title: "請先登入!",
        html: '<div style="height:40px">登入以參與討論交流哦！(ゝ∀･)</div>',
        icon: "warning",
        showConfirmButton: false,
        timer: 2000,
      });
      return;
    }

    if (isFavorite) {
      // 取消收藏
      const res = await fetch(`/api/forum/threadlist-favorite/delete?user_id=${session.user.id}&forum_id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setIsFavorite(false);
        Swal.fire({
          title: "已取消收藏!",
          icon: "success",
          showConfirmButton: false,
          timer: 2000,
        });
      }
    } else {
      // 新增收藏
      const res = await fetch(`/api/forum/threadlist-favorite/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: session.user.id, forum_id: id }),
      });

      if (res.ok) {
        setIsFavorite(true);
        Swal.fire({
          title: "收藏成功!",
          icon: "success",
          showConfirmButton: false,
          timer: 2000,
        });
      }
    }
  };

  return (
    <div className={id?("threadList"):("forumList")} >
      <div className="forumMenu d-flex align-items-center px-3">
        <div className='pt-1 pe-2'>
          <i 
            className="fa-solid fa-circle-arrow-left btn-back" 
            title='回上一頁'
            onClick={() => window.history.back()} // 使用原生的 history.back()
          ></i>
        </div>
        {session ? (
          threadStatus === 1 ? (
            <div
              className="doReply"
              data-bs-toggle="modal"
              data-bs-target="#replyModal"
              onClick={() => setResetEditor(true)} 
            >
              <i className="fa-solid fa-comment-dots icon"></i>我要回覆
            </div>
          ):(
            <div
              className="doReply doReplyNon"
              onClick={() => {
            Swal.fire({
              title: '無法回覆!',
              html: '<div style="height:40px">樓主已下架此討論串無法回覆囉~ ╮(´д`)╭</div>',
              icon: 'warning',
              draggable: false,
              showConfirmButton: false,
              timer: 2000,
            })
          }}
            >
              <i className="fa-solid fa-comment-dots icon"></i>我要回覆
            </div>
          )
          
        ):(
          <div
          className="doReply doReplyNon"
          onClick={() => {
            Swal.fire({
              title: '請先登入!',
              html: '<div style="height:40px">登入以參與討論交流哦！(ゝ∀･)</div>',
              icon: 'warning',
              draggable: false,
              showConfirmButton: false,
              timer: 2000,
            })
          }}
        >
          <i className="fa-solid fa-comment-dots icon"></i>我要回覆
        </div>
        )}
        {session ? (
          <div className="doCollect"  onClick={handleFavorite}>
          {isFavorite ? (
            <>
            <i className="fa-solid fa-heart text-danger"></i><span className='text-danger'>已收藏</span>
            </>
          ):(
            <>
            <i className="fa-solid fa-heart"></i>收藏文章
            </>
          )}
          {/* <i className="fa-solid fa-heart"></i>{isFavorite ? "已收藏" : "收藏文章"} */}
        </div>
        ):(
          <div 
            className="doCollect doCollectNon"
            onClick={() => {
              Swal.fire({
                title: '請先登入!',
                html: '<div style="height:40px">登入以參與討論交流哦！(ゝ∀･)</div>',
                icon: 'warning',
                draggable: false,
                showConfirmButton: false,
                timer: 2000,
              })
            }}
          >
          <i className="fa-solid fa-heart"></i>收藏文章
        </div>
        )}

      </div>
    </div>
  )
}
export default ThreadList
