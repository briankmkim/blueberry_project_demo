import { useState, useEffect, createContext } from 'react';
import { Navigate } from 'react-router-dom';
import { makeStyles } from '@material-ui/core/styles';
import { IconButton, Button, Modal } from '@mui/material';
import Dropzone from 'react-dropzone-uploader'
import Loading from '../components/Loading';
import Demo from '../components/Demo';
import 'react-dropzone-uploader/dist/styles.css'
import WebcamCapture from '../components/Webcam';


const useStyles = makeStyles({
	wrapper: {
		height: '100%',
	},
	dropWrapper: {
		height: '80%',
		padding: '2%',
		'& .dzu-dropzone': {
			height: '100%',
			width: '100%',
			overflow: 'hidden',
		}
	},
	buttonWrapper: {
	},
	buttonSpaced: {
		marginRight: '30px !important'
	},
	modal: {
		display: 'flex',
		justifyContent: 'center',
		alignItems: 'center',
	},
});

const Home = () => {
	const [dropperFiles, setDropperFiles] = useState([]);
	const [prediction, setPrediction] = useState(false);
	const [loading, setLoading] = useState(false);
	const [camera, setCamera] = useState(false);
	const [cameraImage, setCameraImage] = useState(null);
	const sampleImages = ['IMG_0169.jpeg', 'IMG_0170.jpeg', 'IMG_0171.jpeg'];

	const classes = useStyles();

	// called every time a file's `status` changes
	const handleChangeStatus = ({ meta, file }, status) => { console.log('') }

	// receives array of files that are done uploading when submit button is clicked
	const handleSubmit = (files, allFiles) => {
		// console.log(files.map(f => f.meta));
		const data = new FormData();
		for (const file of allFiles) {
			data.append('file[]', file.file, file.name)
		}
		allFiles.forEach(f => f.remove());
		setLoading(true);
		fetch('http://10.240.37.18:5000/predict_multiple', {
			method: 'POST',
			body: data,
		})
		.then(response => response.json())
		.then(jsonData => {
			setPrediction(jsonData.predictions);
		});
	}

	const handleCameraSubmit = (image) => {
		fetch(image)
			.then(res => res.blob())
			.then(blob => {
				const webcamFile = new File([blob], 'webcam.jpg', { type: 'image/jpeg' });
				setDropperFiles([webcamFile]);
			});
			setCamera(false);
	}

	const loadSampleImages = async () => {
		let imageFiles = [];
		let promises = [];
		for (const image of sampleImages) {
			promises.push(fetch(process.env.PUBLIC_URL + '/' + image)
				.then(res => res.blob())
				.then(blob => {
					const imageFile = new File([blob], image, { type: 'image/jpeg' });
					imageFiles.push(imageFile);
				})
			);
		}
		await Promise.all(promises)
		setDropperFiles([...dropperFiles, ...imageFiles]);
	}

	useEffect(() => {
		setDropperFiles([]);
	}, [])

	if (prediction) {
		return (
			<Navigate
				to={{
					pathname: '/results',
				}}
				state={{ res: prediction }}
			/>
		);
	}
	else if (loading) {
		return (
			<div className={classes.wrapper}>
				<Loading />
			</div>
		)
	}

	return (
		<div className={classes.wrapper}>
			{/* <Demo /> */}
			<div className={classes.dropWrapper}>
				<Dropzone 
					className={classes.dropzone}
					onChangeStatus={handleChangeStatus}
					onSubmit={handleSubmit}
					initialFiles={dropperFiles}
					inputContent='Drag and drop input files'
					accept='image/*'
				/>
			</div>
			<div className={classes.buttonWrapper}>
				<Button 
					className={classes.buttonSpaced}
					variant='contained'
					onClick={() => {setCamera(true)}}
				>Camera</Button>
				<Button 
					variant='contained'
					onClick={() => {loadSampleImages()}}
				>Load Sample Images</Button>
			</div>
			<Modal
				className={classes.modal}
				open={camera}
				onClose={() => {setCamera(false)}}
			>
				<WebcamCapture handleSubmit={handleCameraSubmit} />
			</Modal>
		</div>
	);
}

export default Home;
