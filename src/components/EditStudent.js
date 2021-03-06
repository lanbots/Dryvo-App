import React, { Fragment } from "react"
import {
	StyleSheet,
	View,
	Text,
	ScrollView,
	TouchableOpacity,
	Alert,
	ActivityIndicator
} from "react-native"
import { MAIN_PADDING, colors, floatButtonOnlyStyle } from "../consts"
import { strings, errors } from "../i18n"
import ShadowRect from "./ShadowRect"
import { fetchOrError, showImagePicker } from "../actions/utils"
import RectInput from "./RectInput"
import { Button, Icon } from "react-native-elements"
import PageTitle from "./PageTitle"
import { setUser, getRole } from "../actions/auth"
import AlertError from "./AlertError"

export default class EditProfile extends AlertError {
	constructor(props) {
		super(props)
		const student = this.props.navigation.getParam("student")
		this.state = {
			doctor_check: student.doctor_check,
			id_number: student.id_number,
			eyes_check: student.eyes_check,
			theory: student.theory,
			price: student.price,
			number_of_old_lessons: student.number_of_old_lessons.toString(),
			green_form: student.green_form,
			studentId: student.student_id,
			loadingImage: false
		}
	}

	submit = async () => {
		var data = new FormData()
		Object.keys(this.state).forEach(key => {
			let value = this.state[key]
			if (key != "green_form") value = value.toString()
			data.append(key, value)
		})
		const requestParams = {
			method: "POST",
			headers: {
				"Content-Type": "multipart/form-data"
			},
			body: data
		}
		const resp = await this.props.dispatch(
			fetchOrError(`/student/${this.state.studentId}`, requestParams)
		)
		if (resp) {
			if (this.props.user.hasOwnProperty("my_teacher")) {
				// it's a student
				await this.props.dispatch(setUser(resp.json.data))
			}
			this.props.navigation.state.params.onGoBack(resp.json.data)
			Alert.alert(strings("settings.success"))
			this.props.navigation.goBack()
		}
	}

	onChangeText = (param, value) => {
		this.setState({
			[param]: value
		})
	}

	_uploadImage = () => {
		this.setState({ loadingImage: true })
		showImagePicker(
			async source => {
				this.setState({ green_form: source, loadingImage: false })
			},
			{ width: 1000, height: 1000 }
		)
	}

	render() {
		let extraForm
		if (getRole(this.props.user) == "teacher") {
			extraForm = (
				<Fragment>
					<RectInput
						keyboardType={"numeric"}
						label={strings(
							"student_profile.edit_screen.number_of_old_lessons"
						)}
						iconName="format-list-numbered"
						value={this.state.number_of_old_lessons}
						onChangeText={value =>
							this.onChangeText("number_of_old_lessons", value)
						}
					/>
					<RectInput
						keyboardType={"numeric"}
						label={strings("student_profile.edit_screen.price")}
						iconName="dollar-sign"
						iconType="feather"
						value={this.state.price}
						onChangeText={value =>
							this.onChangeText("price", value)
						}
					/>
					<RectInput
						label={strings("student_profile.edit_screen.theory")}
						value={this.state.theory}
						onChangeText={value =>
							this.onChangeText("theory", value)
						}
						switch={true}
					/>
				</Fragment>
			)
		}
		let imageUploaded = <Icon type="feather" name="x" size={24} />
		if (this.state.green_form)
			imageUploaded = <Icon type="feather" name="check" size={24} />
		if (this.state.loadingImage) imageUploaded = <ActivityIndicator />
		return (
			<ScrollView
				keyboardDismissMode="on-drag"
				keyboardShouldPersistTaps="always"
			>
				<View style={styles.container}>
					<View style={styles.headerRow}>
						<Button
							icon={<Icon name="arrow-forward" type="material" />}
							onPress={() => {
								this.props.navigation.goBack()
							}}
							type="clear"
						/>
						<PageTitle
							style={styles.title}
							title={strings("student_profile.edit_screen.title")}
						/>
					</View>
					<ShadowRect style={styles.rect}>
						{extraForm}
						<RectInput
							label={strings("student_profile.id_number")}
							value={this.state.id_number}
							onChangeText={value =>
								this.onChangeText("id_number", value)
							}
						/>
						<RectInput
							label={strings(
								"student_profile.edit_screen.green_form"
							)}
							onPress={this._uploadImage}
							leftSide={imageUploaded}
							empty={true}
						/>
						<RectInput
							label={strings(
								"student_profile.edit_screen.doctor_check"
							)}
							value={this.state.doctor_check}
							onChangeText={value =>
								this.onChangeText("doctor_check", value)
							}
							switch={true}
						/>
						<RectInput
							label={strings(
								"student_profile.edit_screen.eyes_check"
							)}
							value={this.state.eyes_check}
							onChangeText={value =>
								this.onChangeText("eyes_check", value)
							}
							switch={true}
						/>
						<TouchableOpacity
							style={styles.button}
							onPress={this.submit.bind(this)}
						>
							<View>
								<Text style={styles.buttonText}>
									{strings("settings.submit")}
								</Text>
							</View>
						</TouchableOpacity>
					</ShadowRect>
				</View>
			</ScrollView>
		)
	}
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingLeft: MAIN_PADDING,
		paddingRight: MAIN_PADDING,
		marginTop: 20,
		alignItems: "center"
	},
	title: { marginTop: 4 },
	headerRow: {
		flexDirection: "row",
		flex: 1,
		maxHeight: 50,
		alignSelf: "flex-start"
	},
	rect: {
		marginTop: 12,
		marginBottom: 24,
		paddingHorizontal: 0,
		paddingVertical: 0
	},
	rectTitle: {
		fontWeight: "bold",
		alignSelf: "flex-start",
		color: "#5c5959"
	},
	rectInsideView: {
		width: "100%",
		borderBottomWidth: 1,
		borderBottomColor: "#f7f7f7",
		paddingVertical: 6,
		paddingHorizontal: 20,
		paddingVertical: 12,
		flexDirection: "row"
	},
	button: { ...floatButtonOnlyStyle, width: "100%", borderRadius: 0 },
	buttonText: {
		fontWeight: "bold",
		fontSize: 20,
		color: "#fff"
	}
})
