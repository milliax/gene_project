const MapEmbed = ({ placeId }: { placeId: string }) => {
    const src = `https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_API_KEY}&q=place_id:${placeId}&zoom=16`;

    return (
        <iframe
            width="100%"
            height="100%"
            loading="lazy"
            allowFullScreen
            src={src}
            style={{ border: 0 }}
        ></iframe>
    );
};

export default MapEmbed;