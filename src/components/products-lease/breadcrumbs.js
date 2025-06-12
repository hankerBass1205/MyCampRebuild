export default function Breadcrumbs() {
  return (
    <nav aria-label="breadcrumb" className="my-5">
      <ol className="breadcrumb">
        <li className="breadcrumb-item">
          <a href="#">首頁</a>
        </li>
        <li className="breadcrumb-item">露營用品</li>
        <li className="breadcrumb-item">露營帳篷</li>
        <li className="breadcrumb-item active" aria-current="page">
          專業穿骨帳篷
        </li>
      </ol>
    </nav>
  )
}
