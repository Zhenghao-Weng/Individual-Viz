import React, { useRef, useEffect, useState } from 'react';
import {
  CalendarOutlined,
  ProfileOutlined,
  LineChartOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import { Layout, Menu, theme, DatePicker, Button, Drawer, Modal, Collapse, Input, Space, Divider } from 'antd';
import mapboxgl from 'mapbox-gl';
import { NavigationControl } from 'mapbox-gl';
import axios from 'axios';
import ReactECharts from 'echarts-for-react';
import 'mapbox-gl/dist/mapbox-gl.css';
import './App.css';

const { Content, Footer, Sider } = Layout;
const { TextArea } = Input;

mapboxgl.accessToken = 'pk.eyJ1Ijoid3poLTIwMjQiLCJhIjoiY2xzemQ0ODRjMGwwcDJqbHpya3R3dHpteCJ9.sY5IDZKrc5jsKZrVs-EzoQ';

function getItem (label, key, icon, children) {
  return {
    key,
    icon,
    children,
    label,
  };
}
const App = () => {
  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const [open, setOpen] = useState(false);
  const showDrawer = () => {
    setOpen(true);
  };
  const onClose = () => {
    setOpen(false);
  };

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isChartModalOpen, setIsChartModalOpen] = useState(false);
  const showEditModal = () => {
    setIsEditModalOpen(true);
  };
  const showChartModal = () => {
    setIsChartModalOpen(true);
  };
  const showChartModalbyAll = () => {
    setActiveKey('-1');
    setIsChartModalOpen(true);
  };
  const handleOk = () => {
    setIsChartModalOpen(false);
  };
  const handleEditOk = async () => {
    if (editName === '' || editLng === '' || editLat === '') {
      alert('Please enter necessary POI option (Name, Lng, Lat)!')
      return
    }
    try {
      // const url = 'https://services.arcgis.com/Lq3V5RFuTBC9I7kv/arcgis/rest/services/Monthly_Temperature_Observations_1991_2020/FeatureServer/0/query?where=1%3D1&outFields=*&geometry=-0.13%2C51.51%2C-0.1301%2C51.5101&geometryType=esriGeometryEnvelope&inSR=4326&spatialRel=esriSpatialRelWithin&outSR=4326&f=json'
      const url = 'https://services.arcgis.com/Lq3V5RFuTBC9I7kv/arcgis/rest/services/Monthly_Temperature_Observations_1991_2020/FeatureServer/0/query?where=1%3D1&outFields=*&geometry=' + editLng + '%2C' + editLat + '%2C' + editLng + '%2C' + editLat + '&geometryType=esriGeometryEnvelope&inSR=4326&spatialRel=esriSpatialRelWithin&outSR=4326&f=json'
      const response = await axios.get(url);
      const geojson = response.data;
      if (geojson.features.length) {
        let tmp = poiList;
        let data = geojson.features[0].attributes
        let tmpData = {}
        tmpData.geoId = data.OBJECTID

        const targetGeoId = tmpData.geoId;
        const geoIdExists = tmp.some(poi => poi.geoId === targetGeoId);
        if (geoIdExists) {
          alert('An POI already existed in the selected BNG!!!')
        } else {
          tmpData.name = editName
          tmpData.lng = editLng
          tmpData.lat = editLat
          tmpData.data = [data.tasJan, data.tasFeb, data.tasMar, data.tasApr, data.tasMay, data.tasJun, data.tasJul, data.tasAug, data.tasSep, data.tasOct, data.tasNov, data.tasDec]
          tmpData.description = editDis
          tmp.push(tmpData)
          setPoiList(tmp);
          setEditName('');
          setEditLng('');
          setEditLat('');
          setEditDis('');
          alert('Add complete!!!');
          setIsEditModalOpen(false);
        }
      }
      else alert('No available data at the selected point!!!');
    } catch (error) {
      alert('Please enter valid Longitude and Latitude')
      console.error('Error fetching GeoJSON:', error);
    }
  };
  const handleCancel = () => {
    setIsEditModalOpen(false);
    setIsChartModalOpen(false);
    if (echartsRef.current) {
      echartsRef.current.getEchartsInstance().dispose();
    }
  };

  const mapContainer = useRef(null);
  const map = useRef(null);
  const [lng, setLng] = useState(-0.1335);
  const [lat, setLat] = useState(51.524776);
  const [zoom, setZoom] = useState(7);
  const [mapStyle, setMapStyle] = useState('mapbox://styles/wzh-2024/cltevpr0b005x01pk5vy1dg5s');
  const [markers, setMarkers] = useState([]);

  const [poiList, setPoiList] = useState([
    {
      geoId: 2360,
      name: "UCL main campus",
      lng: -0.1335,
      lat: 51.524776,
      data: [5.875000119, 6.07499992875, 8.300000191, 10.7249999045, 13.7999999525, 16.6750006675, 19.02500009525, 18.60000038125, 15.97499990475, 12.5, 8.674999952, 6.1999999285],
      description: "UCl main campus"
    }
  ]);

  const fetchGeoJSON = async () => {
    try {
      // const url = 'https://services.arcgis.com/Lq3V5RFuTBC9I7kv/arcgis/rest/services/Monthly_Temperature_Observations_1991_2020/FeatureServer/0/query?where=1%3D1&outFields=*&geometry=-0.13%2C51.51%2C-0.1301%2C51.5101&geometryType=esriGeometryEnvelope&inSR=4326&spatialRel=esriSpatialRelWithin&outSR=4326&f=json'
      const url = 'https://services.arcgis.com/Lq3V5RFuTBC9I7kv/arcgis/rest/services/Monthly_Temperature_Observations_1991_2020/FeatureServer/0/query?where=1%3D1&outFields=*&geometry=' + lng + '%2C' + lat + '%2C' + lng + '%2C' + lat + '&geometryType=esriGeometryEnvelope&inSR=4326&spatialRel=esriSpatialRelWithin&outSR=4326&f=json'
      const response = await axios.get(url);
      const geojson = response.data;
      if (geojson.features.length) {
        let tmp = poiList;
        let data = geojson.features[0].attributes
        let tmpData = {}
        tmpData.geoId = data.OBJECTID

        const targetGeoId = tmpData.geoId;
        const geoIdExists = tmp.some(poi => poi.geoId === targetGeoId);
        if (geoIdExists) {
          alert('An POI already existed in the selected BNG!!!')
        } else {
          tmpData.name = 'map center' + tmp.length
          tmpData.lng = lng
          tmpData.lat = lat
          tmpData.data = [data.tasJan, data.tasFeb, data.tasMar, data.tasApr, data.tasMay, data.tasJun, data.tasJul, data.tasAug, data.tasSep, data.tasOct, data.tasNov, data.tasDec]
          tmpData.description = 'POI created by instant map center selector'
          tmp.push(tmpData)
          setPoiList(tmp);
          alert('Add complete!!!');
          setIsEditModalOpen(false);
        }

      }
      else alert('No available data at the selected point!!!');
    } catch (error) {
      console.error('Error fetching GeoJSON:', error);
    }
  };

  useEffect(() => {
    if (!map.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: mapStyle,
        center: [lng, lat],
        zoom: zoom,
        maxZoom: 20,
        minZoom: 7,
      });
      map.current.on('move', updateMapState);
      const navigationControl = new NavigationControl();
      map.current.addControl(navigationControl, 'top-right');
    }
    map.current.setStyle(mapStyle);
    const updateMarkers = () => {
      markers.forEach(marker => marker.remove());

      const newMarkers = poiList.map(poi => {
        const marker = new mapboxgl.Marker()
          .setLngLat([poi.lng, poi.lat])
          .addTo(map.current);
        return marker;
      });
      setMarkers(newMarkers);
    };
    updateMarkers();
    return () => {
      markers.forEach(marker => marker.remove());
    };
  }, [lng, lat, zoom, mapStyle, poiList]);

  const updateMapState = () => {
    setLng(map.current.getCenter().lng.toFixed(4));
    setLat(map.current.getCenter().lat.toFixed(4));
    setZoom(map.current.getZoom().toFixed(2));
  };

  const handleDeleteButtonClick = () => {
    if (poiList.length > 1) {
      const updatedPoiList = poiList.filter(poi => poi.geoId != activeKey);
      setPoiList(updatedPoiList);
      setActiveKey(updatedPoiList.length > 0 ? updatedPoiList[0].geoId : '-999');
    }
  };

  const changeDate = (date, dateString) => {
    switch (dateString) {
      case '01':
        setMapStyle('mapbox://styles/wzh-2024/cltevpr0b005x01pk5vy1dg5s');
        break;
      case '02':
        setMapStyle('mapbox://styles/wzh-2024/clt2vvsuj00kt01me0yudfd11');
        break;
      case '03':
        setMapStyle('mapbox://styles/wzh-2024/clt2vy1zn00kp01qu3g0ge952');
        break;
      case '04':
        setMapStyle('mapbox://styles/wzh-2024/clt2vz2sy00lx01qzfqvqbhz1');
        break;
      case '05':
        setMapStyle('mapbox://styles/wzh-2024/clt2w0exu00ly01qzd2wvctmw');
        break;
      case '06':
        setMapStyle('mapbox://styles/wzh-2024/clt2w18bv000d01r05ebkgdvg');
        break;
      case '07':
        setMapStyle('mapbox://styles/wzh-2024/clt2u3zw1000401r0441kasnh');
        break;
      case '08':
        setMapStyle('mapbox://styles/wzh-2024/clt2wl52o000h01r01h12g26j');
        break;
      case '09':
        setMapStyle('mapbox://styles/wzh-2024/clt2w6r4000kr01quhoda6vj7');
        break;
      case '10':
        setMapStyle('mapbox://styles/wzh-2024/clt2w7u7z00bs01qp0u34h4xw');
        break;
      case '11':
        setMapStyle('mapbox://styles/wzh-2024/clt2w8jgi000f01r014x818wj');
        break;
      case '12':
        setMapStyle('mapbox://styles/wzh-2024/clt2wa4b700jr01qo33ot8qlx');
        break;
      default:
        setMapStyle('mapbox://styles/wzh-2024/clt2tcq9u00kf01pi2rfa6v1e');
    }

  };

  const items = [
    getItem('Month Selector', '1', <CalendarOutlined />, [
      getItem('', '2', <DatePicker onChange={changeDate} picker="month" size="small" format="MM" placeholder='Select a month' />),
    ]),
    //getItem('Year Selector', '9', <SlidersOutlined />, []),
    getItem('Point of interest', '3', <ProfileOutlined />, [
      getItem('', '4', <Button type="text" onClick={showDrawer} size='small'>POI List</Button>),
      getItem('', '5', <Button type="text" onClick={showEditModal} size='small'>Add a point of interest</Button>)
    ]),
  ];

  const convertToCollapse = () => {
    return poiList.map(poi => ({
      key: poi.geoId.toString(),
      label: poi.name,
      children: (
        <p>
          Longitude: {poi.lng} | Latitude: {poi.lat}<br /><br />
          Description:<br />{poi.description}<br /><br />
          <Button type="primary" shape="round" icon={<LineChartOutlined />} onClick={showChartModal}>
            Plot by current POI
          </Button><br /><br />
          <Button
            type="primary"
            shape="round"
            icon={<DeleteOutlined />}
            onClick={handleDeleteButtonClick}
            danger
          >
            Delete Current POI
          </Button>
        </p>
      )
    }));
  };
  let collapseItems = convertToCollapse();
  const [activeKey, setActiveKey] = useState('-1');
  const handleCollapseChange = (keys) => {
    setActiveKey(keys[0]);
  };

  const getChartOptions = () => {
    let legendData = [];
    let seriesData = [];
    let chartName = '';

    if (activeKey === '-999') {
      alert('Empty poi List!!!')
      return {}
    }

    if (activeKey === '-1') {
      seriesData = [];
      poiList.forEach(poi => {
        legendData.push(poi.name);
        seriesData.push({
          name: poi.name,
          type: 'line',
          data: poi.data,
        });
      });
      chartName = 'Monthly Average Temperature of all POI';
    }
    else {
      seriesData = [];
      poiList.forEach(poi => {
        if (activeKey == poi.geoId) {
          legendData = [poi.name];
          seriesData = [
            {
              name: poi.name,
              type: 'line',
              data: poi.data,
            },
          ];
          chartName = 'Monthly Average Temperature of ' + poi.name;
        }
      });
    }

    const options = {
      title: {
        text: chartName,
      },
      tooltip: {
        trigger: 'axis',
      },
      legend: {
        data: legendData,
        right: '10%',
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
      },
      toolbox: {
        feature: {
          // saveAsImage: {}
        },
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      },
      yAxis: {
        type: 'value',
      },
      series: seriesData,
    };

    return options;
  };
  const echartsRef = useRef(null);

  const [editName, setEditName] = useState('');
  const [editLng, setEditLng] = useState('');
  const [editLat, setEditLat] = useState('');
  const [editDis, setEditDis] = useState('');

  const changeName = (event) => {
    setEditName(event.target.value)
  };
  const changeLng = (event) => {
    setEditLng(event.target.value)
  };
  const changeLat = (event) => {
    setEditLat(event.target.value)
  };
  const changeDis = (event) => {
    setEditDis(event.target.value)
  };


  return (
    <Layout
      style={{
        minHeight: '100vh',
      }}
    >
      <Sider collapsible collapsed={collapsed} onCollapse={(value) => setCollapsed(value)}>
        <div className="demo-logo-vertical" />
        <Menu theme="dark" defaultSelectedKeys={['1']} mode="inline" items={items} />
      </Sider>
      <Layout>
        <Content
          style={{
            margin: '0 16px',
          }}
        >
          <div
            style={{
              padding: 24,
              minHeight: 360,
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
            }}
          >
            <div ref={mapContainer} className="map-container" />
          </div>
        </Content>
        <Drawer title="Point of interest" onClose={onClose} open={open}>
          <Button type="primary" shape="round" icon={<LineChartOutlined />} onClick={showChartModalbyAll}>
            Plot by all POI
          </Button><br /><br />
          <Collapse accordion items={collapseItems} activeKey={activeKey} onChange={handleCollapseChange} />
        </Drawer>
        <Modal title="Add point of interest" open={isEditModalOpen} onOk={handleEditOk} onCancel={handleCancel} destroyOnClose>
          <p>Current Map center:</p>
          <p> Longitude: {lng} | Latitude: {lat}</p>
          <Button type="primary" onClick={fetchGeoJSON}>Add current map center to POI list</Button>
          <Divider>More Customized Options</Divider>
          <Input style={{ width: '40%', }} placeholder="POI Name" onChange={changeName} /><br /><br />
          <Space><Input style={{ width: '90%', }} placeholder="POI Longitude" onChange={changeLng} /><Input style={{ width: '90%', }} placeholder="POI Latitude" onChange={changeLat} /></Space><br /><br />
          <TextArea rows={4} placeholder='Description for your POI' onChange={changeDis} />
        </Modal>
        <Modal open={isChartModalOpen} onOk={handleOk} onCancel={handleCancel} footer={null} width={1000}>
          <ReactECharts option={getChartOptions()} ref={echartsRef} />
        </Modal>
        <Footer
          style={{
            textAlign: 'center',
          }}
        >
        </Footer>
      </Layout>
    </Layout>
  );
};
export default App;