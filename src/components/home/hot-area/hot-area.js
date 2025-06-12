"use client";

export default function HotArea() {
  return(
    <>
    <section className="d-flex hot">
          <h2
            className="title-style text-center !mb-6 md:!mb-14"
            data-aos="fade-down"
            data-aos-easing="linear"
            data-aos-duration={700}
          >
            熱門露營地點
          </h2>
          <article className="container hot-main">
            <a
              href="#"
              className="item"
              data-aos="fade-up"
              data-aos-easing="linear"
              data-aos-duration={700}
            >
              <div className="image">
                <img src="/images/index/hot1.jpg" alt="img" />
              </div>
              <p>435挑水少年家</p>
            </a>
            <a
              href="#"
              className="item"
              data-aos="fade-up"
              data-aos-easing="linear"
              data-aos-duration={700}
            >
              <div className="image">
                <img src="/images/index/hot2.jpg" alt="img" />
              </div>
              <p>谷漢露營區</p>
            </a>
            <a
              href="#"
              className="item"
              data-aos="fade-up"
              data-aos-easing="linear"
              data-aos-duration={700}
            >
              <div className="image">
                <img src="/images/index/hot3.jpg" alt="img" />
              </div>
              <p>3 人露營帳篷 MH100 Fresh</p>
            </a>
            <a
              href="#"
              className="item"
              data-aos="fade-up"
              data-aos-easing="linear"
              data-aos-duration={700}
            >
              <div className="image">
                <img src="/images/index/hot4.jpg" alt="img" />
              </div>
              <p>435挑水少年家</p>
            </a>
            <a
              href="#"
              className="item"
              data-aos="fade-up"
              data-aos-easing="linear"
              data-aos-duration={700}
            >
              <div className="image">
                <img src="/images/index/hot5.jpg" alt="img" />
              </div>
              <p>松鶴延年</p>
            </a>
            <a
              href="#"
              className="item"
              data-aos="fade-up"
              data-aos-easing="linear"
              data-aos-duration={700}
            >
              <div className="image">
                <img src="/images/index/hot6.jpg" alt="img" />
              </div>
              <p>橘子園</p>
            </a>
            <a
              href="#"
              className="item"
              data-aos="fade-up"
              data-aos-easing="linear"
              data-aos-duration={700}
            >
              <div className="image">
                <img src="/images/index/hot7.jpg" alt="img" />
              </div>
              <p>露薩</p>
            </a>
            <a
              href="#"
              className="item"
              data-aos="fade-up"
              data-aos-easing="linear"
              data-aos-duration={700}
            >
              <div className="image">
                <img src="/images/index/hot8.jpg" alt="img" />
              </div>
              <p>星空下</p>
            </a>
          </article>
        </section>
    </>
  )
}