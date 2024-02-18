import {useState, useEffect} from 'react';
import useAuth from './useAuth';
import { Container, Form } from 'react-bootstrap';
import SpotifyWebApi from 'spotify-web-api-node';
import TrackSearchResult from './TrackSearchResult';
import Player from './Player';
import axios from 'axios';

const spotifyApi = new SpotifyWebApi({
    clientId: '42caee1fd9bb47df873332253f775503',
})

const Dashboard = ({ code }) => {
    const accessToken = useAuth({code});
    const [search, setSearch] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [playingTrack, setPlayingTrack] = useState();
    const [lyrics, setLyrics] = useState('');

    function chooseTrack(track) {
        setPlayingTrack(track);
        setSearchResults('');
        setLyrics("");
    }
    console.log(searchResults);
    
    useEffect(() => {   
        if(!playingTrack) return;

        axios.get('http://localhost:3001/lyrics', {
            params:{
                track: playingTrack.title,
                artist: playingTrack.artist
            }
        }).then(res => {
            setLyrics(res.data.lyrics);
        }) 
    }, [playingTrack]);
    useEffect(() => {
        if(!accessToken) return;
        spotifyApi.setAccessToken(accessToken);
    }, [accessToken]);

    useEffect(() => {
        if(!search) {
            setSearchResults([]);
            return;
        }
        if(!accessToken) return;

        let cancel=false;
        spotifyApi.searchTracks(search).then(res => {
            if(cancel) return;
            setSearchResults(res.body.tracks.items.map(track => {
                let smallestAlbumImage = track.album.images[0];
                track.album.images.map(image => {
                    if(image.height < smallestAlbumImage.height) 
                    smallestAlbumImage=image;
                })
                return ({
                    artist: track.artists[0].name,
                    title: track.name,
                    uri: track.uri,
                    albumUrl: smallestAlbumImage && smallestAlbumImage.url
                })
            }))
        })
        return () => cancel=true
    }, [accessToken, search]);


    return (
        <Container className="d-flex flex-column py-2"
        style={{height:"100vh"}}>
            <Form.Control type="search" placeholder="Search Songs/Artists"
            value={search} onChange={e => setSearch(e.target.value)} />
        <div className="flex-grow-1 my-2"
        style={{overflowY:"auto"}}>
            {searchResults && searchResults.map(track => {
                return (<TrackSearchResult track={track}
                key={track.uri} 
                chooseTrack={chooseTrack}/>);
            })}
        </div>
        {searchResults.length===0?
            (<div className="text-center flex-grow-1"
            style={{whiteSpace: "pre", overflowY: "auto"}}>
                {lyrics}
            </div>):
            ""
        }
        <div style={{position: "floating"}}>
            <Player accessToken={accessToken} trackUri={playingTrack && playingTrack.uri}/>
        </div>
        </Container>
    );
}
 
export default Dashboard;