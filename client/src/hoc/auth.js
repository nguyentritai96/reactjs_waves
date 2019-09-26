import React, { Component } from 'react';
import { connect } from 'react-redux';
import { auth } from '../actions/user_actions';
import CircularProgress from '@material-ui/core/CircularProgress';

export default function(ComposedClass,reload,adminRoute = null){
    class AuthenticationCheck extends Component {

        state = {
            loading: true
        }

        componentDidMount(){
                this.props.dispatch(auth()).then(response =>{
                let user = this.props.user.userData;
                if(!user.isAuth){ // đây không phải là user
                    if(reload){ // mà đi vào private ví dụ: {dashboard}
                        this.props.history.push('/register_login') // thì chuyển ra trang login
                    }
                }else{ // là user: user thường và admin
                    if(adminRoute && !user.isAdmin){ // vào route admin nhưng không phải là admin
                        this.props.history.push('/user/dashboard')
                    } else{ // là admin
                        if(reload === false){ // đi vào trang public sẽ bị chuyển ra dashboard
                            this.props.history.push('/user/dashboard')
                        }
                    }
                }
                this.setState({ loading:false })
            })
        }


        render() {
         
            if(this.state.loading){
                return (
                    <div className="main_loader">
                        <CircularProgress style={{color:'#2196F3'}} thickness={7}/> 
                    </div>
                )
            }
            return (
                <ComposedClass {...this.props} user={this.props.user}/> 
            );
        }
    }

    function mapStateToProps(state){
        return {
            user: state.user
        }
    }

    return connect(mapStateToProps)(AuthenticationCheck)
}


