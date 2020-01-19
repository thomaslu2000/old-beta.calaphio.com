import React, { useEffect, useState } from "react";
import moment from "moment";
import { Calendar, momentLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import axios from "axios";
import { API_URL } from "../env";
import {
	Container,
	Row,
	Col,
	ListGroup,
	ListGroupItem,
	Badge
} from "reactstrap";
import { unsanitize } from "../functions";
import { Link } from "react-router-dom";
import EventSide from "./EventSide";
import { withRouter } from "react-router-dom";
import { isMobile } from "react-device-detect";
import "./css/calendar.css";

function Cal(props) {
	const colorDict = {
		Service: "goldenrod",
		Fellowship: "green",
		Pledge: "deepskyblue",
		Other: "violet"
	};
	const darkColorDict = {
		Service: "darkgoldenrod",
		Fellowship: "darkgreen",
		Pledge: "blue",
		Other: "orchid"
	};
	const localizer = momentLocalizer(moment);

	const [events, setEvents] = useState([]);
	const [eventId, setEventId] = useState(false);

	const [today, setToday] = useState(new Date());
	const [seen, setSeen] = useState([
		today.getFullYear() * 100 + today.getMonth()
	]);
	const [daysEvents, setDaysEvent] = useState([]);
	const [view, setView] = useState("month");

	useEffect(() => {
		if (props.match.params.event_id) {
			setEventId(props.match.params.event_id);
			getDate(props.match.params.event_id);
		} else {
			getEvents(today.getFullYear(), today.getMonth());
		}
	}, []);

	const styleGetter = (event, start, end, isSelected) => {
		let style = {
			backgroundColor: isSelected
				? darkColorDict[event.type]
				: colorDict[event.type],
			fontSize: isMobile ? (view === "month" ? 0 : 8) : 12
		};
		return {
			style
		};
	};

	const onSelect = event => {
		setEventId(event.eventId);
		props.history.push(`/calendar/${event.eventId}`);
	};

	const onRangeChange = dates => {
		if (dates.start) {
			let a = dates.start;
			a.setDate(a.getDate() + 7);
			getEvents(a.getFullYear(), a.getMonth());
		} else {
			if (
				!seen.includes(
					dates[0].getFullYear() * 100 + dates[0].getMonth()
				)
			) {
				getEvents(dates[0].getFullYear(), dates[0].getMonth(), true);
			} else if (
				!seen.includes(
					dates[dates.length - 1].getFullYear() * 100 +
						dates[dates.length - 1].getMonth()
				)
			) {
				getEvents(
					dates[dates.length - 1].getFullYear(),
					dates[dates.length - 1].getMonth(),
					true
				);
			}
		}
	};

	const getEvents = async (year, month, add = false) => {
		await axios
			.get(`${API_URL}/event/month/${year}/${month + 1}`)
			.then(response => {
				let ne = [];
				for (let i = 0; i < response.data.length; i++) {
					let event = response.data[i];
					let type = Boolean(event.type_service)
						? "Service"
						: Boolean(event.type_fellowship)
						? "Fellowship"
						: Boolean(event.type_pledge_meeting)
						? "Pledge"
						: "Other";
					ne.push({
						eventId: event.event_id,
						title: unsanitize(event.title),
						start: new Date(event.start),
						end: new Date(event.end),
						type,
						"allDay?": event.time_allday
					});
				}
				if (add) {
					seen.push(year * 100 + month);
					setSeen(seen);
					setEvents(ne.concat(events));
				} else {
					setEvents(ne);
					setSeen([year * 100 + month]);
				}
			});
	};
	const getDate = async eventId => {
		await axios.get(`${API_URL}/event/date/${eventId}/`).then(response => {
			let date = new Date(response.data[0].date);
			setToday(date);
			getEvents(date.getFullYear(), date.getMonth());
		});
	};
	const selectSlot = e => {
		setToday(e.start);
		setDaysEvent(
			events.filter(d => {
				console.log(d.start);
				console.log(e.start);
				return (
					d.start.getFullYear() === e.start.getFullYear() &&
					d.start.getMonth() === e.start.getMonth() &&
					d.start.getDate() === e.start.getDate()
				);
			})
		);
	};
	return (
		<Container>
			<Row>
				<Col xs="12" md="4">
					<EventSide id={eventId} className="py-3" />
				</Col>
				<Col
					className="border rounded calendar-container"
					style={{
						height: isMobile && view != "day" ? 400 : 800
					}}
					xs="12"
					md="8"
				>
					{isMobile && (
						<ListGroup className="w-75 mx-auto py-3">
							<ListGroupItem>
								Long Press on a Day to View Events
							</ListGroupItem>
							{daysEvents.map(d => {
								return (
									<ListGroupItem
										key={"day" + d.eventId}
										onClick={() => setEventId(d.eventId)}
										className="text-primary"
									>
										<Badge
											className="float-left"
											style={{
												backgroundColor:
													darkColorDict[d.type]
											}}
											pill
										>
											{d.type}
										</Badge>
										{d.title}
									</ListGroupItem>
								);
							})}
						</ListGroup>
					)}
					<Calendar
						className="calendar px-1 py-2 border rounded bg-white"
						events={events}
						showMultiDayTimes
						date={today}
						views={["month", "week", "day"]}
						onView={e => setView(e)}
						localizer={localizer}
						eventPropGetter={styleGetter}
						selectable="ignoreEvents"
						onSelectSlot={selectSlot}
						onSelectEvent={
							isMobile && view === "month" ? selectSlot : onSelect
						}
						longPressThreshold={100}
						onRangeChange={onRangeChange}
						onNavigate={day => setToday(day)}
						popup
					/>
				</Col>
			</Row>
		</Container>
	);
}

export default withRouter(Cal);
