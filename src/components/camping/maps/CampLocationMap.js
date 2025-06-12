"use client";
import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import {
  FaMapMarkerAlt,
  FaMountain,
  FaParking,
  FaStore,
  FaRoute,
} from "react-icons/fa";
import {  WiRaindrop } from "weather-icons-react";
import { motion } from "framer-motion";

export function CampLocationMap({ campData }) {
  const mapRef = useRef(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipContent, setTooltipContent] = useState({});
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isLocationReady, setIsLocationReady] = useState(false);
  const [mapPosition, setMapPosition] = useState({
    latitude: 23.5, // 預設台灣中心點
    longitude: 121.0
  });

  useEffect(() => {
    const getCoordinates = async () => {
      if (!campData?.address) return;
      setIsLocationReady(false);

      try {
        // 使用我們的 geocoding API
        const response = await fetch(
          `/api/camping/geocoding?address=${encodeURIComponent(campData.address)}`
        );
        const data = await response.json();

        if (data.success) {
          setMapPosition({
            latitude: data.latitude,
            longitude: data.longitude
          });
          setIsLocationReady(true);
        } else {
          console.error('Geocoding error:', data.error);
          setIsLocationReady(true);
        }
      } catch (error) {
        console.error('Error getting coordinates:', error);
        setIsLocationReady(true);
      }
    };

    getCoordinates();
  }, [campData?.address]);

  useEffect(() => {
    if (!mapRef.current || !mapPosition.latitude || !mapPosition.longitude) return;

    setIsLoading(true);
    d3.select(mapRef.current).selectAll("*").remove();

    const width = 600;
    const height = 450;

    const svg = d3
      .select(mapRef.current)
      .append("svg")
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

    // 添加多個漸層定義
    const defs = svg.append("defs");

    // 修改主要地圖漸層為非常淡的綠色
    const mainGradient = defs
      .append("linearGradient")
      .attr("id", "main-gradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "100%")
      .attr("y2", "100%");

    mainGradient
      .append("stop")
      .attr("offset", "0%")
      .attr("style", "stop-color: #F2F7F2; stop-opacity: 1"); // 極淡的綠色

    mainGradient
      .append("stop")
      .attr("offset", "100%")
      .attr("style", "stop-color: #E8F0E8; stop-opacity: 1"); // 稍微深一點的淡綠色

    // 修改活躍縣市為大地色系
    const activeGradient = defs
      .append("linearGradient")
      .attr("id", "active-gradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "100%")
      .attr("y2", "100%");

    activeGradient
      .append("stop")
      .attr("offset", "0%")
      .attr("style", "stop-color: #D4B499; stop-opacity: 1"); // 淺大地色

    activeGradient
      .append("stop")
      .attr("offset", "100%")
      .attr("style", "stop-color: #C4A484; stop-opacity: 1"); // 深大地色

    // 懸停效果漸層
    const hoverGradient = defs
      .append("linearGradient")
      .attr("id", "hover-gradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "100%")
      .attr("y2", "100%");

    hoverGradient
      .append("stop")
      .attr("offset", "0%")
      .attr("style", "stop-color: #D5E6B9; stop-opacity: 1");

    hoverGradient
      .append("stop")
      .attr("offset", "100%")
      .attr("style", "stop-color: #C2D6A3; stop-opacity: 1");

    // 增強陰影效果
    const filter = defs
      .append("filter")
      .attr("id", "enhanced-shadow")
      .attr("height", "150%");

    filter
      .append("feGaussianBlur")
      .attr("in", "SourceAlpha")
      .attr("stdDeviation", 4)
      .attr("result", "blur");

    filter
      .append("feOffset")
      .attr("in", "blur")
      .attr("dx", 3)
      .attr("dy", 3)
      .attr("result", "offsetBlur");

    filter
      .append("feComponentTransfer")
      .append("feFuncA")
      .attr("type", "linear")
      .attr("slope", 0.5);

    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "offsetBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // 添加縮放功能
    const zoom = d3
      .zoom()
      .scaleExtent([1, 8])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

    const g = svg.append("g");

    const projection = d3
      .geoMercator()
      .center([mapPosition.longitude, mapPosition.latitude])
      .scale(width * 25)
      .translate([width / 2, height / 2]);

    const path = d3.geoPath().projection(projection);

    // 添加地圖載入動畫
    const loadingIndicator = svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", height / 2)
      .attr("text-anchor", "middle")
      .attr("class", "text-gray-400")
      .text("載入地圖中...");

    fetch("/data/taiwan.json")
      .then((response) => response.json())
      .then((data) => {
        loadingIndicator.remove();

        // 繪製基本地圖
        g.selectAll("path")
          .data(data.features)
          .enter()
          .append("path")
          .attr("d", path)
          .attr(
            "class",
            (d) =>
              `county ${
                d.properties.COUNTYSN === campData.countySN
                  ? "active-county"
                  : ""
              }`
          )
          .attr("fill", (d) =>
            d.properties.COUNTYSN === campData.countySN
              ? "url(#active-gradient)"
              : "url(#main-gradient)"
          )
          .attr("stroke", "#fff")
          .attr("stroke-width", 1.5)
          .attr("filter", "url(#enhanced-shadow)")
          .style("cursor", "pointer")
          .on("mouseover", function (event, d) {
            d3.select(this)
              .transition()
              .duration(200)
              .attr("fill", "url(#hover-gradient)")
              .attr("stroke-width", 1.2)
              .attr("transform", "scale(1.01)");

            const [x, y] = d3.pointer(event, svg.node());
            setShowTooltip(true);
            const isActiveCounty = d.properties.COUNTYSN === campData.countySN;
            setTooltipContent({
              name: d.properties.name,
              isActive: isActiveCounty,
              campName: isActiveCounty ? campData.name : null,
            });
            setTooltipPosition({ x, y });
          })
          .on("mouseout", function (event, d) {
            d3.select(this)
              .transition()
              .duration(300)
              .attr(
                "fill",
                d.properties.COUNTYSN === campData.countySN
                  ? "url(#active-gradient)"
                  : "url(#main-gradient)"
              )
              .attr("stroke-width", 1.5)
              .attr("transform", "scale(1)");

            setShowTooltip(false);
          });

        // 添加營地標記
        const marker = g
          .append("g")
          .attr(
            "transform",
            `translate(${projection([
              mapPosition.longitude,
              mapPosition.latitude
            ]).join(",")})`
          )
          .style("cursor", "pointer")
          .on("click", () => {
            window.open(
              `https://www.google.com/maps/search/?api=1&query=${mapPosition.latitude},${mapPosition.longitude}`
            );
          });

        // 添加旋轉的外環
        const outerRing = marker.append("g");

        // 修改外環大小
        [-1, 1].forEach((x) => {
          [-1, 1].forEach((y) => {
            outerRing
              .append("circle")
              .attr("r", 3) // 增加點的大小
              .attr("cx", x * 18) // 增加環的半徑
              .attr("cy", y * 18)
              .attr("fill", "#B68D40")
              .attr("opacity", 0.6);
          });
        });

        // 添加旋轉動畫
        function rotateRing() {
          outerRing
            .transition()
            .duration(4000)
            .ease(d3.easeLinear)
            .attr("transform", "rotate(360)")
            .on("end", () => {
              outerRing.attr("transform", "rotate(0)");
              rotateRing();
            });
        }
        rotateRing();

        // 中心漣漪效果
        const ripple = marker
          .append("circle")
          .attr("r", 8) // 增加初始半徑
          .attr("fill", "none")
          .attr("stroke", "#B68D40")
          .attr("stroke-width", 2)
          .attr("opacity", 1);

        function pulseRipple() {
          ripple
            .transition()
            .duration(2000)
            .attr("r", 25) // 增加擴散半徑
            .attr("opacity", 0)
            .transition()
            .duration(0)
            .attr("r", 8) // 對應初始半徑
            .attr("opacity", 1)
            .on("end", pulseRipple);
        }
        pulseRipple();

        // 增大中心點
        marker
          .append("circle")
          .attr("r", 6) // 增加中心點大小
          .attr("fill", "#B68D40")
          .attr("stroke", "#fff")
          .attr("stroke-width", 2);

        // 懸停效果
        marker
          .on("mouseover", function () {
            d3.select(this)
              .transition()
              .duration(300)
              .attr(
                "transform",
                `translate(${projection([
                  mapPosition.longitude,
                  mapPosition.latitude
                ]).join(",")}) scale(1.2)`
              );
          })
          .on("mouseout", function () {
            d3.select(this)
              .transition()
              .duration(300)
              .attr(
                "transform",
                `translate(${projection([
                  mapPosition.longitude,
                  mapPosition.latitude
                ]).join(",")}) scale(1)`
              );
          });

        // 添加營地名稱標籤
        marker
          .append("text")
          .attr("x", 12)
          .attr("y", 4)
          .attr("class", "text-sm font-medium fill-gray-700")
          .text(campData.name)
          .style("filter", "url(#enhanced-shadow)");

        setIsLoading(false);
      });

    // 添加比例尺
    const scale = svg
      .append("g")
      .attr("class", "scale")
      .attr("transform", `translate(20, ${height - 30})`);

    scale
      .append("line")
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", 100)
      .attr("y2", 0)
      .attr("stroke", "#666")
      .attr("stroke-width", 2);

    scale
      .append("text")
      .attr("x", 50)
      .attr("y", 20)
      .attr("text-anchor", "middle")
      .attr("class", "text-xs text-gray-600")
      .text("1 km");
  }, [mapPosition, campData]);

  // 生成搜尋連結
  const generateSearchUrl = (keyword) => {
    if (!mapPosition.latitude || !mapPosition.longitude) {
      return `https://www.google.com/maps/search/${encodeURIComponent(campData.address)}+${encodeURIComponent(keyword)}`;
    }
    return `https://www.google.com/maps/search/${encodeURIComponent(keyword)}/@${mapPosition.latitude},${mapPosition.longitude},14z`;
  };

  // 生成導航連結
  const generateNavigationUrl = () => {
    if (!mapPosition.latitude || !mapPosition.longitude) {
      return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(campData.address)}`;
    }
    return `https://www.google.com/maps/dir/?api=1&destination=${mapPosition.latitude},${mapPosition.longitude}`;
  };

  return (
    <div className="space-y-6">
      {/* 標題區塊 */}
      <motion.div
        className="flex flex-col sm:flex-row items-center md:items-start sm:items-center gap-2 mb-2 md:mb-4 pb-3 border-b border-gray-100"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <div className="flex items-center gap-2">
          <motion.svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5 text-[#8B7355]"
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
            animate={{
              scale: [1, 1.1, 1],
              y: [-1, 1, -1],
              rotate: [-3, 3, -3]
            }}
            transition={{
              duration: 3,
              ease: "easeInOut",
              repeat: Infinity,
            }}
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </motion.svg>
          <h2 className="text-xl font-bold text-[#8B7355] m-0">
            營地位置資訊
          </h2>
        </div>

        <div className="text-[#9F9189] text-sm mt-1 sm:mt-0 sm:ms-3">
          {campData?.address && (
            <span>{campData.address}</span>
          )}
        </div>
      </motion.div>

      {/* 地圖容器上方添加功能按鈕 */}
      {isLocationReady && (
        <div className="mt-4 flex flex-wrap gap-2 justify-center">
          <a 
            href={generateNavigationUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 
                       rounded-lg hover:bg-emerald-50 transition-all duration-200 
                       text-gray-700 no-underline hover:no-underline"
          >
            <FaRoute className="text-gray-600 group-hover:text-emerald-600" />
            <span className="text-sm">路線導航</span>
          </a>

          <a 
            href={generateSearchUrl('景點')}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 
                       rounded-lg hover:bg-blue-50 transition-all duration-200 
                       text-gray-700 no-underline hover:no-underline"
          >
            <FaMountain className="text-gray-600 group-hover:text-blue-600" />
            <span className="text-sm">附近景點</span>
          </a>

          <a
            href={generateSearchUrl('停車場')}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 
                       rounded-lg hover:bg-amber-50 transition-all duration-200 
                       text-gray-700 no-underline hover:no-underline"
          >
            <FaParking className="text-gray-600 group-hover:text-amber-600" />
            <span className="text-sm">停車資訊</span>
          </a>

          <a
            href={generateSearchUrl('商店')}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 
                       rounded-lg hover:bg-purple-50 transition-all duration-200 
                       text-gray-700 no-underline hover:no-underline"
          >
            <FaStore className="text-gray-600 group-hover:text-purple-600" />
            <span className="text-sm">附近商店</span>
          </a>
        </div>
      )}
      {/* 地圖容器 */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden relative min-h-[450px]">
        {!isLocationReady ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
            <div className="flex flex-col items-center gap-3">
              <motion.div
                className="w-12 h-12 border-4 border-[#8B7355] border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: "linear"
                }}
              />
              <span className="text-[#8B7355] font-medium">定位營地中...</span>
            </div>
          </div>
        ) : (
          <div className="relative">
            <div ref={mapRef} className="w-full h-[450px]" />
            {showTooltip && (
              <div
                className="absolute z-50 p-2 text-xs bg-gray-900 bg-opacity-90 
                           rounded-lg shadow-lg backdrop-blur-sm transition-all 
                           duration-200 pointer-events-none min-w-[120px]"
                style={{
                  left: `${tooltipPosition.x}px`,
                  top: `${tooltipPosition.y - 20}px`,
                }}
              >
                <div className="space-y-1 text-white">
                  <div className="font-medium border-b border-gray-700 pb-1">
                    {tooltipContent.name}
                  </div>
                  {tooltipContent.isActive && (
                    <>
                      <div className="flex items-center gap-1 text-emerald-400">
                        <FaMapMarkerAlt className="w-3 h-3" />
                        <span>目前營地位置</span>
                      </div>
                      <div className="text-gray-300">
                        {tooltipContent.campName}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// 資訊卡片元件
function InfoCard({ icon, label, value, error }) {
  // 處理溫度範圍的特殊顯示
  const renderTemperature = (value) => {
    if (value.includes("~")) {
      const [min, max] = value
        .split("~")
        .map((t) => t.trim().replace("°C", ""));
      return (
        <div className="flex items-center gap-2">
          <span className="text-blue-500">{min}°C</span>
          <span className="text-gray-400">~</span>
          <span className="text-red-500">{max}°C</span>
        </div>
      );
    }
    return value;
  };

  // 處理降雨機率的特殊顯示
  const renderRainProb = (value) => {
    if (value.includes("%")) {
      const percentage = parseInt(value);
      return (
        <div className="flex items-center gap-2">
          <span
            className={`${percentage > 50 ? "text-blue-500" : "text-gray-600"}`}
          >
            {value}
          </span>
          {percentage > 50 && <WiRaindrop className="text-blue-500 text-lg" />}
        </div>
      );
    }
    return value;
  };

  // 處理紫外線指數的特殊顯示
  const renderUVI = (value) => {
    if (value.includes("(")) {
      const [level, range] = value.split("(");
      return (
        <div className="flex flex-col">
          <span className="font-medium">{level}</span>
          <span className="text-xs text-gray-500">({range}</span>
        </div>
      );
    }
    return value;
  };

  // 根據標籤選擇適當的渲染方式
  const renderValue = () => {
    if (error) return <span className="text-red-500">{value}</span>;

    switch (label) {
      case "溫度範圍":
        return renderTemperature(value);
      case "降雨機率":
        return renderRainProb(value);
      case "紫外線指數":
        return renderUVI(value);
      default:
        return <span className="text-gray-800">{value}</span>;
    }
  };

  return (
    <div
      className={`p-4 bg-white rounded-lg shadow-sm border 
      ${error ? "border-red-200" : "border-gray-100"} 
      hover:shadow-md transition-all duration-200
      hover:border-emerald-200 hover:bg-emerald-50
      cursor-pointer transform hover:-translate-y-1`}
    >
      <div className="flex items-center gap-2 text-gray-600 text-sm mb-2">
        <div className="transition-colors duration-200 group-hover:text-emerald-600">
          {icon}
        </div>
        <span className="font-medium">{label}</span>
      </div>
      <div className="font-medium">{renderValue()}</div>
    </div>
  );
}
