import React from 'react';
import { Switch, Route } from 'react-router-dom';

import Layout from './hoc/layout';
import Auth from './hoc/auth'; // sử dụng Auth gắn vào route của từng component để check auth
// tham số thứ 2 : check user (private là true, public là false, không cần check là null)
// tham số thứ 3 : check admin

import Home from './components/Home/index';
import RegisterLogin from './components/Register_login'; 
import Register from './components/Register_login/register'; 
import UserDashboard from './components/User';
import AddProduct from './components/User/Admin/add_product';
import ManageCategories from './components/User/Admin/manage_categories';
import UserCart from './components/User/cart';

import Shop from './components/Shop';
import ProductPage from './components/Product';
import UpdateProfile from './components/User/update_profile';
import ManageSite from './components/User/Admin/manage_site';


const Routes = () => {
  return(
    <Layout>
      <Switch>
        <Route path="/register_login" exact component={Auth(RegisterLogin, false)}/>
        <Route path="/user/dashboard" exact component={Auth(UserDashboard, true)}/>
        <Route path="/user/cart" exact component={Auth(UserCart, true)}/>
        <Route path="/admin/add_product" exact component={Auth(AddProduct,true)}/>
        <Route path="/admin/manage_categories" exact component={Auth(ManageCategories,true)}/>
        <Route path="/user/user_profile" exact component={Auth(UpdateProfile,true)}/>
        <Route path="/admin/site_info" exact component={Auth(ManageSite,true)}/>


        <Route path="/register" exact component={Auth(Register, false)}/>
        <Route path="/shop" exact component={Auth(Shop, null)}/>
        <Route path="/product_detail/:id" exact component={Auth(ProductPage,null)}/>
        <Route path="/" exact component={Auth(Home, null)}/>
      </Switch>
    </Layout>

  )
}


export default Routes;
