import React from "react"
import {
	View,
	ScrollView,
	Text,
	StyleSheet,
	TouchableOpacity,
	KeyboardAvoidingView,
	Platform,
	Alert
} from "react-native"
import {
	deepLinkingListener,
	deepLinkingRemoveListener
} from "../../actions/utils"
import { connect } from "react-redux"
import { exchangeToken, openFacebook, directLogin } from "../../actions/auth"
import { strings, errors } from "../../i18n"
import { colors, MAIN_PADDING } from "../../consts"
import Logo from "../../components/Logo"
import AuthInput from "../../components/AuthInput"
import LoadingButton from "../../components/LoadingButton"
import validate, { loginValidation } from "../../actions/validate"
import { checkFirebasePermission } from "../../actions/utils"
import AlertError from "../../components/AlertError"

// https://stackoverflow.com/a/53080379/695377
var dummyDeepLinkedUrl
export class SignIn extends AlertError {
	constructor(props) {
		super(props)
		this.state = {}
		this.inputs = {
			email: { keyboardType: "email-address" },
			password: { secureTextEntry: true, iconName: "security" }
		}
		Object.keys(this.inputs).forEach(input => {
			this.state[input] = ""
			this.state[input + "Error"] = ""
		})
		this.handleOpenURL = this.handleOpenURL.bind(this)
		this.login = this.login.bind(this)
	}

	handleOpenURL = async event => {
		if (event.url && event.url != dummyDeepLinkedUrl) {
			dummyDeepLinkedUrl = event.url
			let url = event.url.replace("#_=_", "")
			console.log(`Launched from deeplink ${url}`)
			let regex = /token=(.*)/
			const token = url.match(regex)[1]
			this.props.dispatch(
				exchangeToken(token, async user => {
					if (user) {
						await this.props.dispatch(
							checkFirebasePermission(true, true)
						)
						this.props.navigation.navigate("App")
					}
				})
			)
		}
	}

	async componentDidMount() {
		deepLinkingListener(this.handleOpenURL)
	}

	async componentWillUnmount() {
		await deepLinkingRemoveListener(this.handleOpenURL)
	}

	async login() {
		let error = "",
			flag = true

		for (let input of Object.keys(this.inputs)) {
			error = validate(input, this.state[input], loginValidation)
			if (error) {
				flag = false
				break
			}
		}

		if (!flag) {
			Alert.alert(error)
			return
		}
		this.loginButton.showLoading(true)
		await this.props.dispatch(
			directLogin(this.state.email, this.state.password, async user => {
				if (user) {
					await this.props.dispatch(
						checkFirebasePermission(true, true)
					)
					this.props.navigation.navigate("App")
				} else {
					this.loginButton.showLoading(false)
				}
			})
		)
	}

	renderInputs = () => {
		return Object.keys(this.inputs).map((name, index) => {
			const props = this.inputs[name]
			return (
				<AuthInput
					key={`key${name}`}
					keyboardType={props.keyboardType}
					name={name}
					placeholder={strings("signin." + name)}
					onChangeText={(name, input) =>
						this.setState({ [name]: input })
					}
					value={this.state[name]}
					testID={`${name}Input`}
					iconName={props.iconName || name}
					validation={loginValidation}
					secureTextEntry={props.secureTextEntry || false}
				/>
			)
		})
	}

	render() {
		return (
			<View style={styles.container}>
				<View style={styles.topLogo}>
					<Logo size="medium" />
				</View>
				<KeyboardAvoidingView
					behavior={Platform.OS === "ios" ? "padding" : null}
				>
					<ScrollView
						keyboardDismissMode={
							Platform.OS === "ios" ? "interactive" : "on-drag"
						}
						keyboardShouldPersistTaps="handled"
					>
						<View style={styles.formContainer}>
							{this.renderInputs()}
							<LoadingButton
								title={strings("signin.login_button")}
								onPress={this.login}
								ref={c => (this.loginButton = c)}
								style={styles.loginButton}
								textStyle={styles.loginText}
							/>
							<Text style={styles.or}>
								{strings("signin.or")}
							</Text>
							<LoadingButton
								title={strings("signin.facebook_login")}
								onPress={() => {
									openFacebook()
								}}
								ref={c => (this.facebookButton = c)}
							/>
							<TouchableOpacity
								testID="signUpButton"
								onPress={() => {
									this.props.navigation.navigate("SignUp")
								}}
							>
								<View style={styles.signUpButton}>
									<Text style={styles.callToAction}>
										{strings("signin.not_yet_registered")}
									</Text>
									<Text style={styles.actionButton}>
										{" "}
										{strings("signin.signup_button")}
									</Text>
								</View>
							</TouchableOpacity>
						</View>
					</ScrollView>
				</KeyboardAvoidingView>
			</View>
		)
	}
}

const styles = StyleSheet.create({
	container: {
		flex: 1
	},
	error: {
		marginTop: 20,
		color: "red"
	},
	topLogo: {
		flex: 2,
		justifyContent: "center",
		backgroundColor: colors.blue,
		maxHeight: 240
	},
	formContainer: {
		flex: 3,
		paddingLeft: MAIN_PADDING,
		paddingRight: MAIN_PADDING,
		alignItems: "center"
	},
	loginButton: {
		backgroundColor: "#ececec",
		marginTop: 20
	},
	loginText: {
		color: "#9b9b9b"
	},
	or: {
		marginVertical: 16,
		fontWeight: "bold",
		fontSize: 20,
		color: "#c9c9c9"
	},
	callToAction: {
		color: "#9b9b9b"
	},
	signUpButton: {
		flexDirection: "row",
		marginTop: 20
	},
	actionButton: {
		color: colors.blue
	}
})

const mapStateToProps = state => {
	return {
		error: state.error
	}
}

export default connect(mapStateToProps)(SignIn)
