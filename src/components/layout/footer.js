"use client";
import "@/styles/shared/footer.css";

export default function Footer() {
  return (
    <footer>
      <div className=" footer-main">
        <hr />
        <article className="footer-logo">
          <img src="/images/footer/footer.png" alt="footer logo" />
        </article>
        <ul className="footer-text">
          <li>
            <a href="#">
              <p>找營區</p>
            </a>
            <a href="#" className="footer-item">
              <p>找營區細項</p>
            </a>
            <a href="#" className="footer-item">
              <p>找營區細項</p>
            </a>
          </li>
          <li>
            <a href="#">
              <p>文章列表</p>
            </a>
            <a href="#" className="footer-item">
              <p>文章細項</p>
            </a>
            <a href="#" className="footer-item">
              <p>文章細項</p>
            </a>
          </li>
          <li>
            <a href="#">
              <p>商品列表</p>
            </a>
            <a href="#" className="footer-item">
              <p>商品細項</p>
            </a>
            <a href="#" className="footer-item">
              <p>商品細項</p>
            </a>
            <a href="#" className="footer-item">
              <p>商品細項</p>
            </a>
          </li>
          <li>
            <a href="#">
              <p>社群討論區</p>
            </a>
            <a href="#" className="footer-item">
              <p>社群細項</p>
            </a>
            <a href="#" className="footer-item">
              <p>社群細項</p>
            </a>
          </li>
          <li>
            <a href="#">
              <p>會員專區</p>
            </a>
            <a href="#" className="footer-item">
              <p>會員細項</p>
            </a>
            <a href="#" className="footer-item">
              <p>會員細項</p>
            </a>
          </li>
        </ul>
        <ul className="button-icon  justify-content-between align-items-center">
          <li className="item d-flex flex-column align-items-center">
            <img src="/images/footer/company.png" alt="company" />
            <p className="title">公司信箱</p>
            <p>123@gamil.com</p>
          </li>
          <li className="item d-flex flex-column align-items-center">
            <img src="/images/footer/location.png" alt="location" />
            <p className="title">公司地址</p>
            <p>桃園市中壢區內定里</p>
          </li>
          <li className="item d-flex flex-column align-items-center">
            <img src="/images/footer/tele.png" alt="telephone" />
            <p className="title">公司電話</p>
            <p>03-1234567</p>
          </li>
        </ul>
      </div>
      <div className="copyright">
        <p>Copyright©campimg</p>
      </div>
    </footer>
  );
} 