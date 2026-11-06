import React, { useCallback } from 'react'
import { Admin, defaultDarkTheme, defaultLightTheme, fetchUtils, Resource, withLifecycleCallbacks } from 'react-admin'
import simpleRestProvider from "ra-data-simple-rest";
import CategoryIcon from '@mui/icons-material/Category';
import InventoryIcon from '@mui/icons-material/Inventory2';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import ProductList from './ProductList';
import EditProduct from './EditProduct';
import CreateProduct from './CreateProduct';
import CategoryList from './Category/CategoryList';
import CategoryEdit from './Category/CategoryEdit';
import OrderList from './Orders/OrderList';
import OrderEdit from './Orders/OrderEdit';
import Dashboard from './Dashboard';
import { fileUploadAPI } from '../../api/fileUpload';
import { API_BASE_URL } from '../../api/constant';
import { currentTheme } from '../../utils/theme';

// Base URL of the storage zone that uploaded product images are served from
const CDN_URL = process.env.REACT_APP_CDN_URL || '';
const API = `${API_BASE_URL}/api`;

const httpClient = (url,options={})=>{
  const token = localStorage.getItem('authToken');
  if(!options.headers) options.headers = new Headers();
  options.headers.set('Authorization',`Bearer ${token}`);
  return fetchUtils.fetchJson(url,options);
}

const catalogProvider = withLifecycleCallbacks(simpleRestProvider(API,httpClient),[
  {
    resource:"products",
    beforeSave: async (params) =>{
      let requestBody = {
        ...params
      }
      let productResList = params?.productResources ?? [];
      const fileName = params?.thumbnail?.rawFile?.name?.replaceAll(' ','-');
      const formData = new FormData();
      formData.append("file",params?.thumbnail?.rawFile);
      formData.append("fileName",fileName);

      await fileUploadAPI(formData);
      requestBody.thumbnail = CDN_URL+"/"+fileName;

      const newProductResList = await Promise.all(productResList?.map(async (productResource)=>{
        const fileName = productResource?.url?.rawFile?.name?.replaceAll(' ','-');
        const formData = new FormData();
        formData.append("file",productResource?.url?.rawFile);
        formData.append("fileName",fileName);
        await fileUploadAPI(formData);
        return {
          ...productResource,
          url:CDN_URL+"/"+fileName,
        };
      }));
      return {
        ...requestBody,
        productResources:newProductResList
      };
    }
  }
]);

// Orders use their own endpoints: /api/orders?status=&page=&size=
const ordersProvider = {
  getList: async (resource, params) => {
    const { page = 1, perPage = 25 } = params?.pagination ?? {};
    const query = new URLSearchParams({ page: String(page - 1), size: String(perPage) });
    if (params?.filter?.orderStatus) query.set('status', params.filter.orderStatus);
    const { headers, json } = await httpClient(`${API}/orders?${query}`);
    const total = parseInt(headers.get('content-range')?.split('/').pop(), 10);
    return { data: json, total: Number.isNaN(total) ? json.length : total };
  },
  getOne: async (resource, { id }) => ({ data: (await httpClient(`${API}/orders/${id}`)).json }),
  getMany: async (resource, { ids }) => ({
    data: await Promise.all(ids.map(async (id) => (await httpClient(`${API}/orders/${id}`)).json)),
  }),
  update: async (resource, { id, data }) => ({
    data: (await httpClient(`${API}/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ orderStatus: data?.orderStatus }),
    })).json,
  }),
};

const forResource = (method) => (resource, params) =>
  resource === 'orders' && ordersProvider[method]
    ? ordersProvider[method](resource, params)
    : catalogProvider[method](resource, params);

const dataProvider = {
  ...catalogProvider,
  getList: forResource('getList'),
  getOne: forResource('getOne'),
  getMany: forResource('getMany'),
  update: forResource('update'),
};

// Admin themes in the ShopVerse colours (react-admin shows its own light/dark switch)
const adminLightTheme = {
  ...defaultLightTheme,
  palette: {
    ...defaultLightTheme.palette,
    primary: { main: '#9333ea' },
    secondary: { main: '#db2777' },
    background: { default: '#f8f7fc', paper: '#ffffff' },
  },
  typography: { ...defaultLightTheme.typography, fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' },
};

const adminTheme = {
  ...defaultDarkTheme,
  palette: {
    ...defaultDarkTheme.palette,
    mode: 'dark',
    primary: { main: '#a855f7' },
    secondary: { main: '#ec4899' },
    background: { default: '#0b0a12', paper: '#15141d' },
  },
  typography: { ...defaultDarkTheme.typography, fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' },
};

export const AdminPanel = () => {
  const fetchStats = useCallback(async () => (await httpClient(`${API}/orders/stats`)).json, []);
  const AdminDashboard = useCallback(() => <Dashboard fetchStats={fetchStats} />, [fetchStats]);

  return (
    <Admin dataProvider={dataProvider} basename='/admin' theme={adminLightTheme} darkTheme={adminTheme}
           defaultTheme={currentTheme()} dashboard={AdminDashboard} title="ShopVerse admin">
      <Resource name='orders' list={OrderList} edit={OrderEdit} icon={ReceiptLongIcon} options={{ label: 'Orders' }}/>
      <Resource name='products' list={ProductList} edit={EditProduct} create={CreateProduct} icon={InventoryIcon} options={{ label: 'Products' }}/>
      <Resource name='category' list={CategoryList} edit={CategoryEdit} icon={CategoryIcon} options={{ label: 'Categories' }}/>
    </Admin>
  )
}
